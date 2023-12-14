import type { Tree } from '@nx/devkit';
import { addProjectConfiguration, getProjects } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import migrate from '.';

describe('native nx release migration', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should remove version target', () => {
    addProjectConfiguration(tree, 'a', {
      root: 'libs/a',
      targets: {
        version: {
          executor: '@jscutlery/semver:version',
        },
      },
    });

    migrate(tree);

    const projectConfig = getProjects(tree).get('a');
    expect(projectConfig?.targets?.version).toBeUndefined();
  });

  it('should remove post targets', () => {
    addProjectConfiguration(tree, 'a', {
      root: 'libs/a',
      targets: {
        version: {
          executor: '@jscutlery/semver:version',
          options: {
            postTargets: ['npm', 'github'],
          },
        },
        npm: {
          command: 'exit 0',
        },
        github: {
          command: 'exit 0',
        },
      },
    });

    migrate(tree);

    const projectConfig = getProjects(tree).get('a');
    expect(projectConfig?.targets?.npm).toBeUndefined();
    expect(projectConfig?.targets?.github).toBeUndefined();
  });

  it('should bail out if sync mode is detected', () => {
    addProjectConfiguration(tree, 'a', {
      root: '.',
      targets: {
        version: {
          executor: '@jscutlery/semver:version',
          options: {
            syncVersions: true,
          },
        },
      },
    });

    migrate(tree);

    const projectConfig = getProjects(tree).get('a');
    expect(projectConfig?.targets?.version).toBeDefined();
  });

  it.todo('should remove @jscutlery/semver from package.json');
  it.todo('should remove post targets');
  it.todo('should setup release config in nx.json');
  it.todo('should inform about detected ci setup and suggest how to update it');
});
