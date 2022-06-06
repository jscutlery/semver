import {
  readTargetOptions,
  runExecutor,
  TargetConfiguration,
} from '@nrwl/devkit';
import { createFakeContext } from '../testing';
import { runPostTargets } from './post-target';

jest.mock('@nrwl/devkit', () => ({
  runExecutor: jest.fn(),
  readTargetOptions: jest.fn(),
  parseTargetString: jest.requireActual('@nrwl/devkit').parseTargetString,
  logger: {
    log: jest.fn(),
  },
}));

describe(runPostTargets.name, () => {
  const mockRunExecutor = runExecutor as jest.Mock;
  const mockReadTargetOptions = readTargetOptions as jest.Mock;

  let nextSpy: jest.Mock;

  const additionalProjects: {
    project: string;
    projectRoot: string;
    targets?: Record<string, TargetConfiguration>;
  }[] = [
    {
      project: 'project-a',
      projectRoot: 'libs/project-a',
      targets: {
        test: {
          executor: 'test',
        },
      },
    },
    {
      project: 'project-b',
      projectRoot: 'libs/project-b',
      targets: {
        test: {
          executor: 'test',
        },
      },
    },
    {
      project: 'project-c',
      projectRoot: 'libs/project-c',
      targets: {
        test: {
          executor: 'test',
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

    runPostTargets({
      projectName: 'p',
      postTargets: ['project-a:test', 'project-b:test', 'project-c:test:prod'],
      templateStringContext: {},
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

    runPostTargets({
      projectName: 'p',
      postTargets: ['project-a:test', 'project-b:test'],
      templateStringContext: {},
      context,
    }).subscribe({
      next: nextSpy,
      error: (error) => {
        expect(nextSpy).toBeCalledTimes(1);
        expect(error.toString()).toEqual(
          'Error: Something went wrong with post-target "project-b:test".'
        );
        expect(mockRunExecutor).toBeCalledTimes(2);
        done();
      },
    });
  });

  it('should handle empty post target', (done) => {
    const errorSpy = jest.fn();

    runPostTargets({
      projectName: 'p',
      postTargets: [],
      templateStringContext: {},
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
    runPostTargets({
      projectName: 'p',
      /* The second project "project-foo" is not defined in the workspace. */
      postTargets: ['project-a:test', 'project-foo:test'],
      templateStringContext: {},
      context,
    }).subscribe({
      next: nextSpy,
      error: (error) => {
        expect(nextSpy).toBeCalledTimes(1);
        expect(mockRunExecutor).toBeCalledTimes(1);
        expect(error.toString()).toEqual(
          'Error: The target project "project-foo" does not exist in your workspace. Available projects: "test","project-a","project-b","project-c".'
        );
        done();
      },
    });
  });

  it('should handle wrong post target name', (done) => {
    runPostTargets({
      projectName: 'p',
      /* The second target "foo" is not defined in the workspace. */
      postTargets: ['project-a:test', 'project-b:foo'],
      templateStringContext: {},
      context,
    }).subscribe({
      next: nextSpy,
      error: (error) => {
        expect(nextSpy).toBeCalledTimes(1);
        expect(mockRunExecutor).toBeCalledTimes(1);
        expect(error.toString()).toEqual(
          'Error: The target name "foo" does not exist. Available targets for "project-b": "test".'
        );
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
    mockReadTargetOptions.mockReturnValueOnce({
      notNested: '${num}',
      nestedObject: {
        version: '${version}',
      },
      deepNestedObject: {
        versions: {
          versionA: '${version}-a',
          versionB: '${version}-b',
        },
      },
      arrayWithObjects: {
        assetsArray: [
          {
            name: 'first-asset-${version}.end',
            path: 'path/to/first-asset-${version}.end',
          },
          {
            name: 'second-asset-${version}.end',
            path: 'path/to/second-asset-${version}.end',
          },
        ],
      },
      arrayWithStrings: [
        "first-${version}",
        "seconnd-${version}"
      ]
    });

    const templateStringContext = {
      version: '2.0.0',
      dryRun: true,
      num: 42,
      falseyValue: false,
    };

    runPostTargets({
      projectName: 'p',
      postTargets: ['project-a:test', 'project-b:test', 'project-c:test'],
      templateStringContext,
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
        expect(mockRunExecutor.mock.calls[2][1]).toEqual({
          notNested: 42,
          nestedObject: {
            version: '2.0.0',
          },
          deepNestedObject: {
            versions: {
              versionA: '2.0.0-a',
              versionB: '2.0.0-b',
            },
          },
          arrayWithObjects: {
            assetsArray: [
              {
                name: 'first-asset-2.0.0.end',
                path: 'path/to/first-asset-2.0.0.end',
              },
              {
                name: 'second-asset-2.0.0.end',
                path: 'path/to/second-asset-2.0.0.end',
              },
            ],
          },
          arrayWithStrings: [
            "first-2.0.0",
            "seconnd-2.0.0"
          ]
        });
        done();
      },
    });
  });
});
