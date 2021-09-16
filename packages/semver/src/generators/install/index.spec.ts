import { addProjectConfiguration, readJson, writeJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import * as fs from 'fs';
import * as inquirer from 'inquirer';

import install from '.';

import type { Tree } from '@nrwl/devkit';
import type { SchemaOptions } from './schema';

jest.mock('inquirer');

const defaultOptions: SchemaOptions = {
  syncVersions: false,
  push: true,
  branch: 'main',
  remote: 'origin',
  enforceConventionalCommits: true,
  projects: [],
};

describe('Install generator', () => {
  let tree: Tree;

  beforeEach(() => {
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => null);
    jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation((_path: string, _content: string) => {
        tree.write(_path, _content);
      });
  });

  describe('Workspace Version 1', () => {
    beforeEach(() => {
      tree = createTreeWithEmptyWorkspace(1);
    });

    const options = { ...defaultOptions, syncVersions: true };

    it('should support old workspace definition format', async () => {
      await install(tree, options);

      const workspace = readJson(tree, 'workspace.json');

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
  });

  describe('Workspace Version 2', () => {
    beforeEach(() => {
      tree = createTreeWithEmptyWorkspace(2);
    });

    describe('Sync versioning', () => {
      const options = { ...defaultOptions, syncVersions: true };

      it('should add workspace project to workspace.json', async () => {
        await install(tree, options);

        const workspace = readJson(tree, 'workspace.json');

        expect(workspace.projects.workspace).toBeDefined();
        expect(workspace.projects.workspace.root).toBe('.');
        expect(workspace.projects.workspace.targets).toEqual(
          expect.objectContaining({
            version: {
              executor: '@jscutlery/semver:version',
              options: { syncVersions: true },
            },
          })
        );
      });

      it('should add workspace project to nx.json', async () => {
        await install(tree, options);

        const nxConfig = readJson(tree, 'nx.json');

        expect(nxConfig.projects.workspace).toBeDefined();
        expect(nxConfig.projects.workspace).toEqual({});
      });
    });

    describe('Independent versions', () => {
      const options = {
        ...defaultOptions,
        syncVersions: false,
      };

      beforeEach(async () => {
        addProjectConfiguration(tree, 'lib1', {
          root: 'libs/lib1',
          sourceRoot: 'libs/lib1/src',
          targets: {},
        });

        writeJson(tree, 'libs/lib1/tsconfig.json', {
          files: [],
          include: [],
          references: [],
        });

        addProjectConfiguration(tree, 'lib2', {
          root: 'libs/lib2',
          sourceRoot: 'libs/lib1/src',
          targets: {},
        });

        writeJson(tree, 'libs/lib2/tsconfig.json', {
          files: [],
          include: [],
          references: [],
        });

        jest.spyOn(inquirer, 'prompt').mockResolvedValue({ projects: ['lib1'] });
      });

      afterEach(() =>
        (
          inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>
        ).mockRestore()
      );

      it('should prompt user to select which projects should be versioned', async () => {
        await install(tree, options);

        const workspace = readJson(tree, 'workspace.json');

        expect(inquirer.prompt).toBeCalledWith(
          expect.objectContaining({
            name: 'projects',
            type: 'checkbox',
            choices: expect.arrayContaining([{ name: 'lib1', checked: true }]),
          })
        );
        /* Project "lib1" selected by the prompt. */
        expect(workspace.projects.lib1.targets).toEqual(
          expect.objectContaining({
            version: {
              executor: '@jscutlery/semver:version',
            },
          })
        );
        /* Project "lib2" not selected by the prompt. */
        expect(workspace.projects.lib2.targets.version).toBeUndefined();
      });

      it('should use --projects option', async () => {
        await install(tree, { ...options, projects: ['lib2'] });

        const workspace = readJson(tree, 'workspace.json');

        expect(inquirer.prompt).not.toBeCalled();
        expect(workspace.projects.lib1.targets.version).toBeUndefined();
        expect(workspace.projects.lib2.targets).toEqual(
          expect.objectContaining({
            version: {
              executor: '@jscutlery/semver:version',
            },
          })
        );
      });

      it('should not touch nx.json', async () => {
        await install(tree, options);

        const nxConfig = readJson(tree, 'workspace.json');

        expect(nxConfig.projects.workspace).toBeUndefined();
      });
    });

    describe('Enforce Conventional Commits', () => {
      const options = { ...defaultOptions, enforce: true };

      it('add commitizen to package.json devDepencencies', async () => {
        const packageJson = readJson(tree, 'package.json');
        packageJson.config = {
          other: 'test',
        };
        tree.write('package.json', JSON.stringify(packageJson, null, 2));

        await install(tree, options);

        const packageJson2 = readJson(tree, 'package.json');

        expect(packageJson2.devDependencies.commitizen).toBeDefined();
        expect(
          packageJson2.devDependencies['cz-conventional-changelog']
        ).toBeDefined();
      });

      it('adds commitizen config to package.json if does not exist', async () => {
        await install(tree, options);

        const packageJson = readJson(tree, 'package.json');

        expect(packageJson.config.commitizen.path).toEqual(
          'cz-conventional-changelog'
        );
      });

      it('does not add commitizen config to package.json if exists', async () => {
        const packageJson = readJson(tree, 'package.json');

        packageJson.config = {
          commitizen: {
            path: 'other',
          },
        };
        tree.write('package.json', JSON.stringify(packageJson, null, 2));

        await install(tree, options);

        const packageJson2 = readJson(tree, 'package.json');
        expect(packageJson2.config.commitizen.path).toEqual('other');
      });

      it('add commitlint to package.json devDepencencies', async () => {
        await install(tree, options);

        const packageJson = readJson(tree, 'package.json');
        expect(packageJson.devDependencies['@commitlint/cli']).toBeDefined();
        expect(
          packageJson.devDependencies['@commitlint/config-conventional']
        ).toBeDefined();
      });

      it('adds commitlint config to package.json if does not exist', async () => {
        await install(tree, options);

        const packageJson = readJson(tree, 'package.json');

        expect(packageJson.commitlint.extends).toEqual([
          '@commitlint/config-conventional',
        ]);
      });

      it('does not add commitlint config to package.json if exists', async () => {
        const packageJson = readJson(tree, 'package.json');

        packageJson.commitlint = {
          extends: ['other'],
        };
        tree.write('package.json', JSON.stringify(packageJson, null, 2));

        await install(tree, options);

        const packageJson2 = readJson(tree, 'package.json');

        expect(packageJson2.commitlint.extends).toEqual(['other']);
      });

      it('add husky to package.json devDepencencies', async () => {
        await install(tree, options);

        const packageJson = readJson(tree, 'package.json');
        expect(packageJson.devDependencies.husky).toBeDefined();
      });

      it('adds husky config if does not exist', async () => {
        await install(tree, options);

        const packageJson = readJson(tree, 'package.json');

        expect(tree.exists('.husky/commit-msg')).toEqual(true);
        expect(packageJson.scripts.prepare).toEqual('husky install');
      });

      it('does not add husky config if exists', async () => {
        tree.write('.husky/_/husky.sh', '');
        tree.write('.husky/commit-msg', 'test');

        await install(tree, options);

        const packageJson = readJson(tree, 'package.json');

        expect(tree.read('.husky/commit-msg').toString()).toEqual('test');
        expect(packageJson.scripts.prepare).toBeUndefined();
      });

      it('does nothing if no enforceConventionalCommits', async () => {
        await install(tree, { ...options, enforceConventionalCommits: false });

        const packageJson = readJson(tree, 'package.json');

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
});
