import { getProjects } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import type { Tree } from '@nrwl/devkit';

import migrate from '.';

function serializeJson(json: unknown) {
  return `${JSON.stringify(json, null, 2)}\n`;
}

describe('2.0.0 migration schematic', () => {
  let appTree: Tree;

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should update --root-changelog=false option to --skip-root-changelog=true', () => {
    appTree.write(
      'workspace.json',
      serializeJson({
        version: 1,
        projects: {
          demo: {
            targets: {
              version: {
                executor: '@jscutlery/semver',
                options: {
                  rootChangelog: false,
                },
              },
            },
          },
        },
      })
    );

    migrate(appTree);

    const projects = getProjects(appTree);
    expect(projects.get('demo')?.targets?.version.options).not.toContainKey(
      'rootChangelog'
    );
    expect(projects.get('demo')?.targets?.version.options).toEqual(
      expect.objectContaining({
        skipRootChangelog: true,
      })
    );
  });

  it('should update --root-changelog=true option to --skip-root-changelog=false', () => {
    appTree.write(
      'workspace.json',
      serializeJson({
        version: 1,
        projects: {
          demo: {
            targets: {
              version: {
                executor: '@jscutlery/semver',
                options: {
                  rootChangelog: true,
                },
              },
            },
          },
        },
      })
    );

    migrate(appTree);

    const projects = getProjects(appTree);
    expect(projects.get('demo')?.targets?.version.options).not.toContainKey(
      'rootChangelog'
    );
    expect(projects.get('demo')?.targets?.version.options).toEqual(
      expect.objectContaining({
        skipRootChangelog: false,
      })
    );
  });

  it('should not update other targets', () => {
    appTree.write(
      'workspace.json',
      serializeJson({
        version: 1,
        projects: {
          demo: {
            targets: {
              test: {
                executor: 'another',
                options: { option: 'value' },
              },
            },
          },
        },
      })
    );

    migrate(appTree);

    const projects = getProjects(appTree);
    expect(projects.get('demo')?.targets?.test).toEqual({
      executor: 'another',
      options: { option: 'value' },
    });
  });
});
