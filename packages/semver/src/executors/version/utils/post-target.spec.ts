import { runExecutor, readTargetOptions } from '@nrwl/devkit';

import { createFakeContext } from '../testing';
import { executePostTargets } from './post-target';

jest.mock('@nrwl/devkit', () => ({
  runExecutor: jest.fn(),
  readTargetOptions: jest.fn(),
  parseTargetString: jest.requireActual('@nrwl/devkit').parseTargetString,
}));

describe(executePostTargets.name, () => {
  const mockRunExecutor = runExecutor as jest.Mock;
  const mockReadTargetOptions = readTargetOptions as jest.Mock;

  let nextSpy: jest.Mock;

  const additionalProjects = [
    {
      project: 'project-a',
      projectRoot: 'libs/project-a',
      targets: {
        test: {
          project: 'project-a',
          target: 'test',
        },
      },
    },
    {
      project: 'project-b',
      projectRoot: 'libs/project-b',
      targets: {
        test: {
          project: 'project-b',
          target: 'test',
        },
      },
    },
    {
      project: 'project-c',
      projectRoot: 'libs/project-c',
      targets: {
        test: {
          project: 'project-c',
          target: 'test',
        },
      },
    },
  ];

  const context = createFakeContext({
    project: 'test',
    projectRoot: 'libs/test',
    workspaceRoot: '/root',
    additionalProjects: additionalProjects,
  });

  beforeEach(() => {
    nextSpy = jest.fn();
    mockRunExecutor.mockImplementation(function* () {
      yield { success: true };
    });
    mockReadTargetOptions.mockReturnValue({});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should successfully execute post targets', (done) => {
    mockReadTargetOptions.mockReturnValue({
      optionA: 'optionA',
    });

    executePostTargets({
      postTargets: ['project-a:test', 'project-b:test', 'project-c:test:prod'],
      context,
    }).subscribe({
      next: nextSpy,
      complete: () => {
        expect(nextSpy).toBeCalledTimes(3);
        expect(mockRunExecutor).toBeCalledTimes(3);
        expect(mockRunExecutor.mock.calls[0][0]).toEqual(
          expect.objectContaining({
            project: 'project-a',
            target: 'test',
          })
        );
        expect(mockRunExecutor.mock.calls[1][0]).toEqual(
          expect.objectContaining({
            project: 'project-b',
            target: 'test',
          })
        );
        expect(mockRunExecutor.mock.calls[1][1]).toEqual(
          expect.objectContaining({
            optionA: 'optionA',
          })
        );
        expect(mockRunExecutor.mock.calls[2][0]).toEqual(
          expect.objectContaining({
            project: 'project-c',
            target: 'test',
            configuration: 'prod',
          })
        );
        done();
      },
    });
  });

  it('should handle post target failure', (done) => {
    mockRunExecutor.mockImplementationOnce(function* () {
      yield { success: true };
    });
    mockRunExecutor.mockImplementationOnce(function* () {
      yield new Error('Nop!');
    });

    executePostTargets({
      postTargets: ['project-a:test', 'project-b:test'],
      context,
    }).subscribe({
      next: nextSpy,
      error: (error) => {
        expect(nextSpy).toBeCalledTimes(1);
        expect(error.toString()).toEqual(
          expect.stringMatching(
            'Something went wrong with post target: "project-b:test"'
          )
        );
        expect(mockRunExecutor).toBeCalledTimes(2);
        done();
      },
    });
  });

  it('should handle empty post target', (done) => {
    const errorSpy = jest.fn();

    executePostTargets({
      postTargets: [],
      context,
    }).subscribe({
      next: nextSpy,
      error: errorSpy,
      complete: () => {
        expect(nextSpy).not.toBeCalled();
        expect(errorSpy).not.toBeCalled();
        expect(mockRunExecutor).not.toBeCalled();
        done();
      },
    });
  });

  it('should handle wrong post target project', (done) => {
    executePostTargets({
      postTargets: ['project-a:test', 'project-foo:test'],
      context,
    }).subscribe({
      next: nextSpy,
      error: (error) => {
        expect(nextSpy).toBeCalledTimes(1);
        expect(error.toString()).toEqual(
          `Error: The target project "project-foo" does not exist in your workspace.\nAvailable projects: [test,project-a,project-b,project-c]`
        );
        expect(mockRunExecutor).toBeCalledTimes(1);
        done();
      },
    });
  });

  it('should handle wrong post target target', (done) => {
    executePostTargets({
      postTargets: ['project-a:test', 'project-b:foo'],
      context,
    }).subscribe({
      next: nextSpy,
      error: (error) => {
        expect(nextSpy).toBeCalledTimes(1);
        expect(error.toString()).toEqual(
          `Error: The target name "foo" does not exist.\nAvailable targets for "project-b": [test]`
        );
        expect(mockRunExecutor).toBeCalledTimes(1);
        done();
      },
    });
  });

  it('should forward and resolve options', (done) => {
    mockReadTargetOptions.mockReturnValueOnce({
      optionA: 'optionA',
      version: '${version}',
      dryRun: '${dryRun}',
      numeric: '${num}',
      falseyValue: '${falseyValue}',
    });
    mockReadTargetOptions.mockReturnValueOnce({
      optionB: 'optionB',
      version: 'project@${version}',
    });

    const resolvableOptions = {
      version: '2.0.0',
      dryRun: true,
      num: 42,
      falseyValue: false,
    };

    executePostTargets({
      postTargets: ['project-a:test', 'project-b:test'],
      resolvableOptions,
      context,
    }).subscribe({
      complete: () => {
        expect(mockRunExecutor.mock.calls[0][1]).toEqual({
          optionA: 'optionA',
          version: '2.0.0',
          dryRun: true,
          numeric: 42,
          falseyValue: false,
        });
        expect(mockRunExecutor.mock.calls[1][1]).toEqual({
          optionB: 'optionB',
          version: 'project@2.0.0',
        });
        done();
      },
    });
  });
});
