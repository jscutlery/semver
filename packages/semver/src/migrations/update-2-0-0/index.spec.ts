import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { readWorkspace } from '@nrwl/workspace';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../../../migrations.json');

function serializeJson(json: any) {
  return `${JSON.stringify(json, null, 2)}\n`;
}

describe('2.0.0 migration schematic', () => {
  let appTree: Tree;
  let schematicRunner: SchematicTestRunner;

  beforeEach(async () => {
    schematicRunner = new SchematicTestRunner(
      '@jscutlery/semver',
      collectionPath
    );

    appTree = createEmptyWorkspace(Tree.empty());
  });

  it('should update --root-changelog=false option to --skip-root-changelog=true', async () => {
    appTree.overwrite(
      'workspace.json',
      serializeJson({
        version: 1,
        projects: {
          demo: {
            architect: {
              version: {
                builder: '@jscutlery/semver',
                options: {
                  rootChangelog: false,
                },
              },
            },
          },
        },
      })
    );

    const tree = await schematicRunner
      .runSchematicAsync('migration-2-0-0', undefined, appTree)
      .toPromise();

    const workspace = readWorkspace(tree);

    expect(workspace.projects.demo.architect.version.options).not.toContainKey(
      'rootChangelog'
    );
    expect(workspace.projects.demo.architect.version.options).toEqual(
      expect.objectContaining({
        skipRootChangelog: true,
      })
    );
  });

  it('should update --root-changelog=true option to --skip-root-changelog=false', async () => {
    appTree.overwrite(
      'workspace.json',
      serializeJson({
        version: 1,
        projects: {
          demo: {
            architect: {
              version: {
                builder: '@jscutlery/semver',
                options: {
                  rootChangelog: true,
                },
              },
            },
          },
        },
      })
    );

    const tree = await schematicRunner
      .runSchematicAsync('migration-2-0-0', undefined, appTree)
      .toPromise();

    const workspace = readWorkspace(tree);

    expect(workspace.projects.demo.architect.version.options).not.toContainKey(
      'rootChangelog'
    );
    expect(workspace.projects.demo.architect.version.options).toEqual(
      expect.objectContaining({
        skipRootChangelog: false,
      })
    );
  });
});
