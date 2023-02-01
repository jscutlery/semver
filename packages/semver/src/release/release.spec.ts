import { createProjectGraphAsync, ProjectGraph } from '@nrwl/devkit';
import * as fs from 'fs/promises';
import { vol } from 'memfs';
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
    beforeEach(() => {
      vol.fromJSON(
        {
          'semver.json': JSON.stringify({
            packages: [
              { name: 'cdk', type: 'independent', path: 'packages/cdk' },
            ],
          }),
        },
        cwd
      );

      projectGraphMock.mockResolvedValue({
        nodes: {
          cdk: {
            name: 'cdk',
            type: 'lib',
            data: {
              files: [],
              root: 'packages/cdk',
              targets: {},
              tags: [],
            },
          },
        },
        dependencies: {},
      } satisfies ProjectGraph);
    });

    it('should read config file', async () => {
      const spy = jest.spyOn(fs, 'readFile');
      await release();
      expect(spy).toHaveBeenCalledWith('/tmp/semver.json', 'utf-8');
      spy.mockClear();
    });

    it('should throw when project is not defined', async () => {
      projectGraphMock.mockResolvedValue({
        nodes: {},
        dependencies: {},
      } satisfies ProjectGraph);
      await expect(release()).rejects.toThrow('Could not find project "cdk"');
    });
  });
});
