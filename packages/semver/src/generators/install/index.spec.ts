import {
  addProjectConfiguration,
  readJson,
  writeJson,
  type Tree,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as inquirer from 'inquirer';

import install from '.';

import type { SchemaOptions } from './schema';

jest.mock('inquirer');

const defaultOptions: SchemaOptions = {
  syncVersions: false,
  enforceConventionalCommits: true,
  projects: [],
};

describe('Install generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('Sync versioning', () => {
    const options = { ...defaultOptions, syncVersions: true };

    it('should add a workspace project.json to the root of the workspace', async () => {
      await install(tree, options);

      const projectJSON = readJson(tree, 'project.json');

      expect(projectJSON).toBeDefined();
      expect(projectJSON.targets).toEqual(
        expect.objectContaining({
          version: {
            executor: '@jscutlery/semver:version',
            options: expect.objectContaining({ syncVersions: true }),
          },
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

      const lib1 = readJson(tree, 'libs/lib1/project.json');
      const lib2 = readJson(tree, 'libs/lib2/project.json');

      expect(inquirer.prompt).toBeCalledWith(
        expect.objectContaining({
          name: 'projects',
          type: 'checkbox',
          choices: expect.arrayContaining([{ name: 'lib1', checked: true }]),
        })
      );
      /* Project "lib1" selected by the prompt. */
      expect(lib1.targets).toEqual(
        expect.objectContaining({
          version: {
            executor: '@jscutlery/semver:version',
          },
        })
      );
      /* Project "lib2" not selected by the prompt. */
      expect(lib2.targets.version).toBeUndefined();
    });

    it('should use --projects option', async () => {
      await install(tree, { ...options, projects: ['lib2'] });

      const lib1 = readJson(tree, 'libs/lib1/project.json');
      const lib2 = readJson(tree, 'libs/lib2/project.json');

      expect(inquirer.prompt).not.toBeCalled();
      expect(lib1.targets.version).toBeUndefined();
      expect(lib2.targets).toEqual(
        expect.objectContaining({
          version: {
            executor: '@jscutlery/semver:version',
          },
        })
      );
    });

    it('should forward --baseBranch option to all projects', async () => {
      jest
        .spyOn(inquirer, 'prompt')
        .mockResolvedValue({ projects: ['lib1', 'lib2'] });

      await install(tree, { ...options, baseBranch: 'master' });

      const lib1 = readJson(tree, 'libs/lib1/project.json');
      const lib2 = readJson(tree, 'libs/lib2/project.json');

      expect(lib1.targets).toEqual(
        expect.objectContaining({
          version: {
            executor: '@jscutlery/semver:version',
            options: expect.objectContaining({ baseBranch: 'master' }),
          },
        })
      );
      expect(lib2.targets).toEqual(
        expect.objectContaining({
          version: {
            executor: '@jscutlery/semver:version',
            options: expect.objectContaining({ baseBranch: 'master' }),
          },
        })
      );
    });

    it('should not create a root project.json', async () => {
      await install(tree, options);

      let projectJSON;

      try {
        projectJSON = readJson(tree, 'project.json');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        expect(error?.message).toEqual('Cannot find project.json');
      }

      expect(projectJSON).toBeUndefined();
    });

    describe('--preset option', () => {
      it('should install conventional config', async () => {
        await install(tree, { ...defaultOptions, preset: 'conventional' });

        const packageJson = readJson(tree, 'package.json');
        const lib1 = readJson(tree, 'libs/lib1/project.json');

        expect(packageJson.devDependencies).toContainKeys([
          '@commitlint/cli',
          '@commitlint/config-conventional',
        ]);
        expect(lib1.targets).toEqual(
          expect.objectContaining({
            version: {
              executor: '@jscutlery/semver:version',
              options: expect.objectContaining({ preset: 'conventional' }),
            },
          })
        );
      });

      it('should install angular config', async () => {
        await install(tree, { ...defaultOptions, preset: 'angular' });

        const packageJson = readJson(tree, 'package.json');
        const lib1 = readJson(tree, 'libs/lib1/project.json');

        expect(packageJson.devDependencies).toContainKeys([
          '@commitlint/cli',
          '@commitlint/config-angular',
        ]);
        expect(lib1.targets).toEqual(
          expect.objectContaining({
            version: {
              executor: '@jscutlery/semver:version',
              options: expect.objectContaining({ preset: 'angular' }),
            },
          })
        );
      });

      it('should install angular config', async () => {
        await install(tree, { ...defaultOptions, preset: 'conventional' });

        const lib1 = readJson(tree, 'libs/lib1/project.json');

        expect(lib1.targets).toEqual(
          expect.objectContaining({
            version: {
              executor: '@jscutlery/semver:version',
              options: expect.objectContaining({ preset: 'conventional' }),
            },
          })
        );
      });

      it('extends conventional commitlint config', async () => {
        await install(tree, { ...options, preset: 'conventional' });

        const commitlintConfig = readJson(tree, '.commitlintrc.json');

        expect(commitlintConfig.extends).toEqual([
          '@commitlint/config-conventional',
        ]);
      });

      it('extends angular commitlint config', async () => {
        await install(tree, { ...options, preset: 'angular' });

        const commitlintConfig = readJson(tree, '.commitlintrc.json');

        expect(commitlintConfig.extends).toEqual([
          '@commitlint/config-angular',
        ]);
      });
    });
  });

  describe('Enforce Conventional Commits', () => {
    const options: SchemaOptions = {
      ...defaultOptions,
      enforceConventionalCommits: true,
      preset: 'angular',
    };

    it('add commitlint to package.json devDepencencies', async () => {
      await install(tree, options);

      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.devDependencies).toContainKeys([
        '@commitlint/cli',
        '@commitlint/config-angular',
      ]);
    });

    it('adds commitlint config if does not exist', async () => {
      await install(tree, options);

      const commitlintConfig = readJson(tree, '.commitlintrc.json');

      expect(commitlintConfig.extends).toEqual(['@commitlint/config-angular']);
    });

    it('does not add commitlint config to package.json if exists', async () => {
      const packageJson = readJson(tree, 'package.json');

      packageJson.commitlint = {
        extends: ['other'],
      };
      tree.write('package.json', JSON.stringify(packageJson, null, 2));

      await install(tree, options);

      expect(readJson(tree, 'package.json').commitlint.extends).toEqual([
        'other',
      ]);
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

      expect(tree.read('.husky/commit-msg')?.toString()).toEqual('test');
      expect(packageJson?.scripts?.prepare).toBeUndefined();
    });

    it('does nothing if no enforceConventionalCommits', async () => {
      await install(tree, { ...options, enforceConventionalCommits: false });

      const packageJson = readJson(tree, 'package.json');

      expect(packageJson.devDependencies).not.toContainKeys([
        '@commitlint/cli',
        '@commitlint/config-angular',
      ]);
    });
  });

  describe('Create Changelog', () => {
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
    it('should create CHANGELOG.md in lib1', async () => {
      await install(tree, { ...options, projects: ['lib1', 'lib2'] });

      expect(tree.exists('libs/lib1/CHANGELOG.md')).toBeTrue();
      expect(tree.exists('libs/lib2/CHANGELOG.md')).toBeTrue();
    });
  });
});
