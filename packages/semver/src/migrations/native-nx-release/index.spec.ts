import type { Tree } from '@nx/devkit';
import { addProjectConfiguration, getProjects } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import migrate from '.';

describe('native nx release migration', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace();

    addProjectConfiguration(tree, 'a', {
      root: 'libs/a',
      targets: {
        version: {
          executor: '@jscutlery/semver:version',
        },
      },
    });

    migrate(tree);
  });

  it('should remove version target', () => {
    const projectConfig = getProjects(tree).get('a');
    expect(projectConfig).toBeDefined();
    expect(projectConfig?.targets?.version).toBeUndefined();
  });

  it.todo('should remove @jscutlery/semver from package.json');
  it.todo('should remove post targets');
  it.todo('should setup release config in nx.json');
  it.todo('should inform about detected ci setup and suggest how to update it');
});
