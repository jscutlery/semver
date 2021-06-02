import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { readJsonInTree, readNxJsonInTree, readWorkspace } from '@nrwl/workspace';
import { createEmptyWorkspace, runSchematic } from '@nrwl/workspace/testing';
import * as fs from 'fs';
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
  enforceConventionalCommits: true,
};

describe('ng-add schematic', () => {
  let appTree: Tree;
  let schematicRunner: SchematicTestRunner;

  beforeEach(async () => {
    schematicRunner = new SchematicTestRunner(
      '@jscutlery/semver',
      collectionPath
    );

    appTree = createEmptyWorkspace(Tree.empty());
    appTree = await runSchematic('lib', libOptions, appTree);
  });

  beforeEach(() => {
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => null);
    jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation((_path: string, _content: string) => {
        appTree.create(_path, _content);
      });
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

      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ projects: ['lib'] });
    });

    afterEach(() =>
      (
        inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>
      ).mockRestore()
    );

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

    it('should use --projects option', async () => {
      const tree = await schematicRunner
        .runSchematicAsync(
          'ng-add',
          { ...options, projects: ['another-lib'] },
          appTree
        )
        .toPromise();

      const workspace = readWorkspace(tree);

      expect(inquirer.prompt).not.toBeCalled();
      expect(workspace.projects.lib.architect.version).toBeUndefined();
      expect(workspace.projects['another-lib'].architect).toEqual(
        expect.objectContaining({
          version: {
            builder: '@jscutlery/semver:version',
            options: { syncVersions: false },
          },
        })
      );
    });

    it('should not touch nx.json', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const nxConfig = readNxJsonInTree(tree);

      expect(nxConfig.projects.workspace).toBeUndefined();
    });
  });

  describe('Enforce Conventional Commits', () => {
    const options = { ...defaultOptions, syncVersions: true };

    it('add commitizen to package.json devDepencencies', async () => {
      const packageJson = JSON.parse(
        appTree.get('package.json').content.toString()
      );
      packageJson.config = {
        other: 'test',
      };
      appTree.overwrite('package.json', JSON.stringify(packageJson, null, 2));

      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const packageJson2 = readJsonInTree(tree, 'package.json');

      expect(packageJson2.devDependencies.commitizen).toEqual('^4.2.4');
      expect(packageJson2.devDependencies['cz-conventional-changelog']).toEqual(
        '^3.3.0'
      );
    });

    it('adds commitizen config to package.json if does not exist', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const packageJson = readJsonInTree(tree, 'package.json');

      expect(packageJson.config.commitizen.path).toEqual(
        'cz-conventional-changelog'
      );
    });

    it('does not add commitizen config to package.json if exists', async () => {
      const packageJson = JSON.parse(
        appTree.get('package.json').content.toString()
      );
      packageJson.config = {
        commitizen: {
          path: 'other',
        },
      };
      appTree.overwrite('package.json', JSON.stringify(packageJson, null, 2));

      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const packageJson2 = readJsonInTree(tree, 'package.json');
      expect(packageJson2.config.commitizen.path).toEqual('other');
    });

    it('add commitlint to package.json devDepencencies', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const packageJson = readJsonInTree(tree, 'package.json');
      expect(packageJson.devDependencies['@commitlint/cli']).toEqual('^12.1.4');
      expect(
        packageJson.devDependencies['@commitlint/config-conventional']
      ).toEqual('^12.1.4');
    });

    it('adds commitlint config to package.json if does not exist', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const packageJson = readJsonInTree(tree, 'package.json');

      expect(packageJson.commitlint.extends).toEqual([
        '@commitlint/config-conventional',
      ]);
    });

    it('does not add commitlint config to package.json if exists', async () => {
      const packageJson = JSON.parse(
        appTree.get('package.json').content.toString()
      );
      packageJson.commitlint = {
        extends: ['other'],
      };
      appTree.overwrite('package.json', JSON.stringify(packageJson, null, 2));

      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const packageJson2 = readJsonInTree(tree, 'package.json');

      expect(packageJson2.commitlint.extends).toEqual(['other']);
    });

    it('add husky to package.json devDepencencies', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();

      const packageJson = readJsonInTree(tree, 'package.json');
      expect(packageJson.devDependencies.husky).toBeDefined();
    });

    it('adds husky config if does not exist', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();
      const packageJson = readJsonInTree(tree, 'package.json');

      expect(tree.exists('.husky/commit-msg')).toEqual(true);
      expect(packageJson.scripts.prepare).toEqual('husky install');
    });

    it('does not add husky config if exists', async () => {
      appTree.create('.husky/_/husky.sh', '');
      appTree.create('.husky/commit-msg', 'test');
      const tree = await schematicRunner
        .runSchematicAsync('ng-add', options, appTree)
        .toPromise();
      const packageJson = readJsonInTree(tree, 'package.json');

      expect(tree.readContent('.husky/commit-msg')).toEqual('test');
      expect(packageJson.scripts.prepare).toBeUndefined();
    });

    it('does nothing if no enforceConventionalCommits', async () => {
      const tree = await schematicRunner
        .runSchematicAsync(
          'ng-add',
          { ...options, enforceConventionalCommits: false },
          appTree
        )
        .toPromise();
      const packageJson = readJsonInTree(tree, 'package.json');

      expect(packageJson.devDependencies.commitizen).toBeUndefined();
      expect(
        packageJson.devDependencies['cz-conventional-changelog']
      ).toBeUndefined();
      expect(packageJson.devDependencies['@commitlint/cli']).toBeUndefined();
      expect(
        packageJson.devDependencies['@commitlint/config-conventional']
      ).toBeUndefined();
      expect(packageJson.devDependencies.husky).toBeUndefined();
    });
  });
});
