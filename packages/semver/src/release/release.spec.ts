import { TestingDevkit } from '../testing/devkit';
import { Config } from './config';
import { release } from './release';

describe(release.name, () => {
  describe('when semver.json does not exist or is invalid', () => {
    it('should throw an error when does not exist', async () => {
      new TestingDevkit({}, { nodes: {}, dependencies: {} });
      await expect(release()).rejects.toThrow('Could not find semver.json');
    });

    it('should throw an error when invalid', async () => {
      new TestingDevkit(
        { 'semver.json': 'invalid' },
        { nodes: {}, dependencies: {} }
      );
      await expect(release()).rejects.toThrow('Invalid semver.json');
    });
  });

  describe('when semver.json exists', () => {
    const config: Config = {
      packages: [
        { name: 'template', type: 'independent', path: 'packages/template' },
      ],
    };

    beforeEach(() => {
      new TestingDevkit(
        {
          'semver.json': JSON.stringify(config),
        },
        {
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
        }
      );
    });

    it('should not throw', async () => {
      await expect(release()).resolves.not.toThrow();
    });
  });
});
