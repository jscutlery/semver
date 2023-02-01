import { createProjectGraphAsync, ProjectGraph } from '@nrwl/devkit';
import * as fs from 'fs/promises';
import { vol } from 'memfs';
import { Config } from './config';
import { release } from './release';

const cwd = '/tmp';

jest.mock('process', () => ({ cwd: () => cwd }));
jest.mock('fs/promises', () => jest.requireActual('memfs').fs.promises);
jest.mock('@nrwl/devkit', () => ({
  ...jest.requireActual('@nrwl/devkit'),
  createProjectGraphAsync: jest.fn(),
}));

describe(release.name, () => {
  const projectGraphMock = createProjectGraphAsync as jest.Mock;

  afterEach(() => {
    vol.reset();
    projectGraphMock.mockClear();
  });

  describe('when semver.json does not exist or is invalid', () => {
    it('should throw an error when does not exist', async () => {
      await expect(release()).rejects.toThrow('Could not find semver.json');
    });

    it('should throw an error when invalid', async () => {
      vol.fromJSON(
        {
          'semver.json': JSON.stringify({
            invalid: 'json',
          }),
        },
        cwd
      );
      await expect(release()).rejects.toThrow('Invalid semver.json');
    });
  });

  describe('when semver.json exists', () => {
    const config: Config = {
      packages: [
        { name: 'template', type: 'independent', path: 'packages/template' },
        {
          name: 'cdk',
          type: 'group',
          packages: [
            { name: 'cdk-core', path: 'packages/cdk/core' },
            { name: 'cdk-aws', path: 'packages/cdk/aws' },
          ],
        },
      ],
    };

    beforeEach(() => {
      vol.fromJSON(
        {
          'semver.json': JSON.stringify(config),
        },
        cwd
      );

      projectGraphMock.mockResolvedValue({
        nodes: {
          template: {
            name: 'template',
            type: 'lib',
            data: {
              files: [],
              root: 'packages/template',
              targets: {},
              tags: [],
            },
          },
          'cdk-core': {
            name: 'cdk-core',
            type: 'lib',
            data: {
              files: [],
              root: 'packages/cdk/core',
              targets: {},
              tags: [],
            },
          },
          'cdk-aws': {
            name: 'cdk-core',
            type: 'lib',
            data: {
              files: [],
              root: 'packages/cdk/core',
              targets: {},
              tags: [],
            },
          },
        },
        dependencies: {},
      } satisfies ProjectGraph);
    });

    it('should throw when project is not defined', async () => {
      projectGraphMock.mockResolvedValue({
        nodes: {},
        dependencies: {},
      } satisfies ProjectGraph);
      await expect(release()).rejects.toThrow(
        'Could not find project "template"'
      );
    });

    it('should throw when a project is not defined in a group', async () => {
      projectGraphMock.mockResolvedValue({
        nodes: {
          template: {
            name: 'template',
            type: 'lib',
            data: {
              files: [],
              root: 'packages/template',
              targets: {},
              tags: [],
            },
          },
        },
        dependencies: {},
      } satisfies ProjectGraph);
      await expect(release()).rejects.toThrow(
        'Could not find all projects in group "cdk"'
      );
    });

    it('should read config file', async () => {
      const spy = jest.spyOn(fs, 'readFile');
      await release();
      expect(spy).toHaveBeenCalledWith('/tmp/semver.json', 'utf-8');
      spy.mockClear();
    });
  });
});
