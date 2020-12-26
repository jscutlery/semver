import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { readJsonInTree, readWorkspace } from '@nrwl/workspace';
import { createEmptyWorkspace, runSchematic } from '@nrwl/workspace/testing';
import * as path from 'path';

import { SchemaOptions } from './schema';

const collectionPath = path.join(__dirname, '../../../collection.json');

const libOptions = { name: 'lib' };

let options: SchemaOptions = {
  syncVersions: false,
  branch: 'main',
  remote: 'origin',
  push: true,
};

describe('ng-add schematic', () => {
  let appTree: Tree;

  let schematicRunner: SchematicTestRunner;

  beforeEach(async () => {
    schematicRunner = new SchematicTestRunner(
      '@jscutlery/semver',
      collectionPath
    );

    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    appTree = await runSchematic('lib', libOptions, appTree);
  });

  it('should add proper package to dev dependencies', async () => {
    const tree = await schematicRunner
      .runSchematicAsync('ng-add', options, appTree)
      .toPromise();

    const packageJson = readJsonInTree(tree, 'package.json');

    expect(packageJson.dependencies['@jscutlery/semver']).toBeUndefined();
    expect(packageJson.devDependencies['@jscutlery/semver']).toBeDefined();
  });

  describe('Sync versions', () => {
    options = { ...options, syncVersions: true };

    it('should add workspace project to workspace.json', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const workspace = readWorkspace(tree);

      expect(workspace.projects.workspace).toBeDefined();
      expect(workspace.projects.workspace.root).toBe('.');
      expect(workspace.projects.workspace.architect).toEqual(
        expect.objectContaining({
          version: {
            builder: '@jscutlery/semver:version',
            options: { syncVersions: true },
          },
        })
      );
    });

    it.todo('should add workspace project to nx.json if it does not exist');
  });
});
