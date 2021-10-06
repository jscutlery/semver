import { runExecutor } from '@nrwl/devkit';

import { createFakeContext } from '../testing';
import { executePostTargets } from './post-target';

jest.mock('@nrwl/devkit', () => ({
  runExecutor: jest.fn(),
  parseTargetString: jest.requireActual('@nrwl/devkit').parseTargetString,
}));

describe(executePostTargets.name, () => {
  const mockRunExecutor = runExecutor as jest.Mock;

  let nextSpy: jest.Mock;

  const context = createFakeContext({
    project: 'test',
    projectRoot: 'libs/test',
    workspaceRoot: '/root',
  });

  beforeEach(() => {
    nextSpy = jest.fn();
    mockRunExecutor.mockImplementation(function* () {
      yield { success: true };
    });
  });

  afterEach(() => {
    mockRunExecutor.mockReset();
  });

  it('should successfully execute post targets', (done) => {
    executePostTargets({
      postTargets: [
        'project-a:test',
        {
          executor: 'project-b:test',
          options: {
            optionA: 'optionA',
          },
        },
        'project-c:test:prod',
      ],
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

  it('should forward and resolve options', (done) => {
    const postTargets = [
      {
        executor: 'project-a:test',
        options: {
          optionA: 'optionA',
          version: '${version}',
          dryRun: '${dryRun}',
        },
      },
      {
        executor: 'project-b:test',
        options: {
          optionB: 'optionB',
          version: 'project@${version}',
        },
      },
    ];

    const resolvableOptions = {
      version: '2.0.0',
      dryRun: true,
    };

    executePostTargets({
      postTargets,
      resolvableOptions,
      context,
    }).subscribe({
      complete: () => {
        expect(mockRunExecutor.mock.calls[0][1]).toEqual({
          optionA: 'optionA',
          version: '2.0.0',
          dryRun: true,
        });
        expect(mockRunExecutor.mock.calls[1][1]).toEqual({
          optionB: 'optionB',
          version: 'project@2.0.0',
        });
        done();
      },
    });
  });

  it('should emit an error when an option is not expected type', (done) => {
    const postTargets = [
      {
        executor: 'project-a:test',
        options: {
          option() {
            return 'Nop!';
          },
        },
      },
    ];

    executePostTargets({
      postTargets,
      context,
    }).subscribe({
      error: (error) => {
        expect(error.toString()).toEqual(
          expect.stringMatching('Cannot resolve "option" with type function')
        );
        done();
      },
    });
  });
});
