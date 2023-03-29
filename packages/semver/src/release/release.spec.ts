import { setupGitRepo } from '../testing/setup';
import { TestingDevkit } from '../testing/testing-devkit';
import { release } from './release';

const cwd = '/tmp/project';

describe(release.name, () => {
  const logSpy = jest.spyOn(console, 'log') as jest.Mock;

  beforeAll(async () => {
    await setupGitRepo({ cwd });
  });

  afterEach(() => {
    logSpy.mockClear();
  });

  describe('when semver.json does not exist or is invalid', () => {
    it('should throw an error when does not exist', async () => {
      new TestingDevkit({ nodes: {}, dependencies: {} }, {});
      await expect(release()).rejects.toThrow('Could not find semver.json');
    });

    it('should throw an error when invalid', async () => {
      new TestingDevkit(
        { nodes: {}, dependencies: {} },
        {
          'semver.json': 'invalid',
        }
      );
      await expect(release()).rejects.toThrow('Invalid semver.json');
    });
  });

  // describe('when semver.json exists', () => {
  //   const config: Config = {
  //     packages: [
  //       { name: 'template', type: 'independent', path: 'packages/template' },
  //       {
  //         name: 'cdk',
  //         type: 'group',
  //         path: 'packages/cdk',
  //         packages: [
  //           { name: 'cdk-core', path: 'packages/cdk/core' },
  //           { name: 'cdk-aws', path: 'packages/cdk/aws' },
  //         ],
  //       },
  //     ],
  //   };

  //   beforeEach(() => {
  //     vol.fromJSON(
  //       {
  //         'semver.json': JSON.stringify(config),
  //       },
  //       cwd
  //     );

  //     projectGraphMock.mockResolvedValue({
  //       nodes: {
  //         template: {
  //           name: 'template',
  //           type: 'lib',
  //           data: {
  //             files: [],
  //             root: 'packages/template',
  //             targets: {},
  //             tags: [],
  //           },
  //         },
  //         'cdk-core': {
  //           name: 'cdk-core',
  //           type: 'lib',
  //           data: {
  //             files: [],
  //             root: 'packages/cdk/core',
  //             targets: {},
  //             tags: [],
  //           },
  //         },
  //         'cdk-aws': {
  //           name: 'cdk-core',
  //           type: 'lib',
  //           data: {
  //             files: [],
  //             root: 'packages/cdk/core',
  //             targets: {},
  //             tags: [],
  //           },
  //         },
  //       },
  //       dependencies: {},
  //     } satisfies ProjectGraph);
  //   });

  //   it('should throw when project is not defined', async () => {
  //     projectGraphMock.mockResolvedValue({
  //       nodes: {},
  //       dependencies: {},
  //     } satisfies ProjectGraph);
  //     await expect(release()).rejects.toThrow(
  //       'Could not find project "template"'
  //     );
  //   });

  //   it('should throw when a project is not defined in a group', async () => {
  //     projectGraphMock.mockResolvedValue({
  //       nodes: {
  //         template: {
  //           name: 'template',
  //           type: 'lib',
  //           data: {
  //             files: [],
  //             root: 'packages/template',
  //             targets: {},
  //             tags: [],
  //           },
  //         },
  //       },
  //       dependencies: {},
  //     } satisfies ProjectGraph);
  //     await expect(release()).rejects.toThrow(
  //       'Could not find all projects in group "cdk"'
  //     );
  //   });

  //   it('should read config file', async () => {
  //     const readFileSpy = jest.spyOn(fs, 'readFile');
  //     await release();
  //     expect(readFileSpy).toHaveBeenCalledWith('/tmp/semver.json', 'utf-8');
  //     readFileSpy.mockClear();
  //   });

  //   it('should calculate new version', async () => {
  //     // getTagsMock.mockResolvedValue([
  //     //   'cdk-1.1.0',
  //     //   'cdk-1.0.1',
  //     //   'cdk-1.0.0',
  //     //   'template-1.1.0',
  //     //   'template-1.0.1',
  //     //   'template-1.0.0',
  //     // ]);

  //     await release();

  //     expect(logSpy).toHaveBeenCalledWith(
  //       'Releasing template from 1.1.0 to 2.0.0'
  //     );
  //     expect(logSpy).toHaveBeenCalledWith(
  //       'Abort: Releasing cdk is not yet implemented. Skipping.'
  //     );
  //   });
  // });
});
