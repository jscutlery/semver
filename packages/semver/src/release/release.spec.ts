import { TestingDevkit } from '../testing/devkit';
import { release } from './release';

describe(release, () => {
  it('should throw an error when config does not exist', async () => {
    new TestingDevkit({}, { nodes: {}, dependencies: {} });
    await expect(release()).rejects.toThrow('Could not find semver.json');
  });

  it('should throw an error when config is invalid', async () => {
    new TestingDevkit(
      { 'semver.json': 'invalid' },
      { nodes: {}, dependencies: {} }
    );
    await expect(release()).rejects.toThrow('Invalid semver.json');
  });

  it('should not throw', async () => {
    new TestingDevkit(
      {
        'semver.json': JSON.stringify({
          packages: [
            {
              name: 'template',
              type: 'independent',
              path: 'packages/template',
            },
          ],
        }),
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
    await expect(release()).resolves.not.toThrow();
  });
});
