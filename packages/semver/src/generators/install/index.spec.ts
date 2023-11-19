import {
  addProjectConfiguration,
  readJson,
  writeJson,
  type Tree,
  logger,
  detectPackageManager,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as inquirer from 'inquirer';

import install from '.';

import type { SchemaOptions } from './schema';

jest.mock('inquirer');
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  detectPackageManager: jest.fn().mockReturnValue('npm'),
}));

const detectPackageManagerMock = detectPackageManager as jest.MockedFunction<
  typeof detectPackageManager
>;

const defaultOptions: SchemaOptions = {
  syncVersions: false,
  enforceConventionalCommits: true,
  projects: [],
  skipInstall: false,
  baseBranch: 'main',
  preset: 'conventionalcommits',
};

describe('@jscutlery/semver:install', () => {
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
        }),
      );
    });
  });

  describe('Independent versions', () => {
    const options = {
      ...defaultOptions,
      syncVersions: false,
    };
    const { projects, projectName1, projectName2 } = createProjectNames();

    beforeEach(async () => {
      addProjects(tree, projects);

      jest
        .spyOn(inquirer, 'prompt')
        .mockResolvedValue({ projects: [projectName1] });
    });

    afterEach(() =>
      (
        inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>
      ).mockRestore(),
    );

    it('should prompt user to select which projects should be versioned', async () => {
      await install(tree, options);

      const lib1 = findJson(tree, projectName1, 'project.json');
      const lib2 = findJson(tree, projectName2, 'project.json');

      expect(inquirer.prompt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'projects',
          type: 'checkbox',
          choices: expect.arrayContaining([
            { name: projectName1, checked: true },
          ]),
        }),
      );
      /* Project "lib1" selected by the prompt. */
      expect(lib1.targets).toEqual(
        expect.objectContaining({
          version: {
            executor: '@jscutlery/semver:version',
            options: expect.toBeObject(),
          },
        }),
      );
      /* Project "lib2" not selected by the prompt. */
      expect(lib2.targets.version).toBeUndefined();
    });

    it('should use --projects option', async () => {
      await install(tree, { ...options, projects: [projectName2] });

      const lib1 = findJson(tree, projectName1, 'project.json');
      const lib2 = findJson(tree, projectName2, 'project.json');

      expect(inquirer.prompt).not.toHaveBeenCalled();
      expect(lib1.targets.version).toBeUndefined();
      expect(lib2.targets).toEqual(
        expect.objectContaining({
          version: {
            executor: '@jscutlery/semver:version',
            options: expect.toBeObject(),
          },
        }),
      );
    });

    it('should forward --baseBranch option to all projects', async () => {
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ projects: projects });

      await install(tree, { ...options, baseBranch: 'master' });

      const lib1 = findJson(tree, projectName1, 'project.json');
      const lib2 = findJson(tree, projectName2, 'project.json');

      expect(lib1.targets).toEqual(
        expect.objectContaining({
          version: {
            executor: '@jscutlery/semver:version',
            options: expect.objectContaining({ baseBranch: 'master' }),
          },
        }),
      );
      expect(lib2.targets).toEqual(
        expect.objectContaining({
          version: {
            executor: '@jscutlery/semver:version',
            options: expect.objectContaining({ baseBranch: 'master' }),
          },
        }),
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
        await install(tree, {
          ...defaultOptions,
          preset: 'conventionalcommits',
        });

        const packageJson = readJson(tree, 'package.json');
        const lib1 = findJson(tree, projectName1, 'project.json');

        expect(packageJson.devDependencies).toContainKeys([
          '@commitlint/cli',
          '@commitlint/config-conventional',
        ]);
        expect(lib1.targets).toEqual(
          expect.objectContaining({
            version: {
              executor: '@jscutlery/semver:version',
              options: expect.objectContaining({
                preset: 'conventionalcommits',
              }),
            },
          }),
        );
      });

      it('should install angular config', async () => {
        await install(tree, { ...defaultOptions, preset: 'angular' });

        const packageJson = readJson(tree, 'package.json');
        const lib1 = findJson(tree, projectName1, 'project.json');

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
          }),
        );
      });

      it('should install angular config', async () => {
        await install(tree, {
          ...defaultOptions,
          preset: 'conventionalcommits',
        });

        const lib1 = findJson(tree, projectName1, 'project.json');

        expect(lib1.targets).toEqual(
          expect.objectContaining({
            version: {
              executor: '@jscutlery/semver:version',
              options: expect.objectContaining({
                preset: 'conventionalcommits',
              }),
            },
          }),
        );
      });

      it('extends conventional commitlint config', async () => {
        await install(tree, { ...options, preset: 'conventionalcommits' });

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

    it('skip if config not found', async () => {
      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation();

      await install(tree, { ...options, preset: 'atom' });

      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.devDependencies).not.toContainKeys([
        '@commitlint/cli',
        'husky',
      ]);
      expect(tree.exists('.commitlintrc.json')).toBeFalse();
      expect(tree.exists('.husky')).toBeFalse();
      expect(warnSpy).toHaveBeenCalled();
    });

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
    const { projects, projectName1, projectName2 } = createProjectNames();

    beforeEach(async () => {
      addProjects(tree, projects);

      jest
        .spyOn(inquirer, 'prompt')
        .mockResolvedValue({ projects: [projectName1] });
    });

    afterEach(() =>
      (
        inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>
      ).mockRestore(),
    );
    it('should create CHANGELOG.md in lib1 and lib2', async () => {
      await install(tree, { ...options, projects: projects });

      expect(findProjectFile(tree, projectName1, 'CHANGELOG.md')).toBeTrue();
      expect(findProjectFile(tree, projectName2, 'CHANGELOG.md')).toBeTrue();
      expect(findProjectFile(tree, 'lib3', 'CHANGELOG.md')).toBeFalse();
    });
  });

  it('use corresponding package manager (npx)', async () => {
    await install(tree, defaultOptions);

    const commitlintConfig = tree.read('.husky/commit-msg')?.toString();
    expect(commitlintConfig).toContain('npx --no commitlint');
  });

  it('use corresponding package manager (yarn)', async () => {
    detectPackageManagerMock.mockReturnValue('yarn');

    await install(tree, defaultOptions);

    const commitlintConfig = tree.read('.husky/commit-msg')?.toString();
    expect(commitlintConfig).toContain('yarn run commitlint');
  });

  it('use corresponding package manager (pnpm)', async () => {
    detectPackageManagerMock.mockReturnValue('pnpm');

    await install(tree, defaultOptions);

    const commitlintConfig = tree.read('.husky/commit-msg')?.toString();
    expect(commitlintConfig).toContain('pnpm commitlint');
  });
});

function createProjectNames() {
  const projectName1 = 'lib1';
  const projectName2 = 'lib2';
  const projects = [projectName1, projectName2];

  return { projects, projectName1, projectName2 };
}

function findProjectFile(tree: Tree, projectName: string, fileName: string) {
  return tree.exists(`libs/${projectName}/${fileName}`);
}

function findJson(tree: Tree, projectName: string, fileName: string) {
  return readJson(tree, `libs/${projectName}/${fileName}`);
}

function addProjects(tree: Tree, projectNames: string[]) {
  projectNames.forEach((projectName) => {
    addProjectConfiguration(tree, projectName, {
      root: `libs/${projectName}`,
      sourceRoot: `libs/${projectName}/src`,
      targets: {},
    });

    writeJson(tree, `libs/${projectName}/tsconfig.json`, {
      files: [],
      include: [],
      references: [],
    });
  });
}
