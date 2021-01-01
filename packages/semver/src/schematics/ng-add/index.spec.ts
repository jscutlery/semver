import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { readNxJsonInTree, readWorkspace } from '@nrwl/workspace';
import { createEmptyWorkspace, runSchematic } from '@nrwl/workspace/testing';
import * as inquirer from 'inquirer';
import * as path from 'path';

import { SchemaOptions } from './schema';

jest.mock('inquirer');

const collectionPath = path.join(__dirname, '../../../collection.json');

const libOptions = { name: 'lib' };

const defaultOptions: SchemaOptions = {
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
    };

    beforeEach(async () => {
      appTree = await runSchematic('lib', { name: 'another-lib' }, appTree);

      (inquirer as any).prompt = jest.fn(() =>
        Promise.resolve({ projects: ['lib'] })
      );
    });

    it('should prompt user to select which projects should be versioned', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const workspace = readWorkspace(tree);

      expect(inquirer.prompt).toBeCalledWith(
        expect.objectContaining({
          name: 'projects',
          type: 'checkbox',
          choices: expect.arrayContaining([{ name: 'lib', checked: true }]),
        })
      );
      /* Project "lib" selected by the prompt. */
      expect(workspace.projects.lib.architect).toEqual(
        expect.objectContaining({
          version: {
            builder: '@jscutlery/semver:version',
            options: { syncVersions: false },
          },
        })
      );
      /* Project "another-lib" not selected by the prompt. */
      expect(
        workspace.projects['another-lib'].architect.version
      ).toBeUndefined();
    });

    it('should not touch nx.json', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const nxConfig = readNxJsonInTree(tree);

      expect(nxConfig.projects.workspace).toBeUndefined();
    });
  });
});
