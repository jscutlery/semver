import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import {
  readJsonInTree,
  readNxJsonInTree,
  readWorkspace,
} from '@nrwl/workspace';
import { createEmptyWorkspace, runSchematic } from '@nrwl/workspace/testing';
import * as path from 'path';

import { SchemaOptions } from './schema';

const collectionPath = path.join(__dirname, '../../../collection.json');

const libOptions = { name: 'lib' };

const defaultOptions: SchemaOptions = {
  projectName: 'lib',
  syncVersions: false,
  push: true,
  branch: 'main',
  remote: 'origin',
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
      .runSchematicAsync('ng-add', defaultOptions, appTree)
      .toPromise();

    const packageJson = readJsonInTree(tree, 'package.json');

    expect(packageJson.dependencies['@jscutlery/semver']).toBeUndefined();
    expect(packageJson.devDependencies['@jscutlery/semver']).toBeDefined();
  });

  describe('Sync versions', () => {
    const options = { ...defaultOptions, syncVersions: true };

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

    it('should add workspace project to nx.json', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const nxConfig = readNxJsonInTree(tree);

      expect(nxConfig.projects.workspace).toBeDefined();
      expect(nxConfig.projects.workspace).toEqual(
        expect.objectContaining({
          tags: [],
        })
      );
    });
  });

  describe('Independent versions', () => {
    const options = {
      ...defaultOptions,
      syncVersions: false,
      projectName: 'lib',
    };

    it('should throw if --project-name is not defined', async () => {
      try {
        await schematicRunner
          .runSchematicAsync(
            'ng-add',
            { ...options, projectName: undefined },
            appTree
          )
          .toPromise();
      } catch (error) {
        expect(error.message).toContain('Missing option --project-name');
      }
    });

    it('should add version builder to the given project', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const workspace = readWorkspace(tree);

      expect(workspace.projects.lib.architect).toEqual(
        expect.objectContaining({
          version: {
            builder: '@jscutlery/semver:version',
            options: { syncVersions: false },
          },
        })
      );
    });

    xit('🚧 should not touch nx.json', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const nxConfig = readNxJsonInTree(tree);

      expect(nxConfig.projects.workspace).toBeUndefined();
    });
  });
});
