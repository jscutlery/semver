import { fileExists } from '@nrwl/nx-plugin/testing';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import version from './';
import { createFakeContext, setupTestingWorkspace } from './testing';
import { readPackageJson } from './utils/project';

import type { TestingWorkspace } from './testing';
import type { VersionBuilderSchema } from './schema';
import { execAsync } from './utils/exec-async';
import { of } from 'rxjs';

jest.mock('./utils/exec-async');
import { lastValueFrom } from 'rxjs';

describe('@jscutlery/semver:version', () => {
  const mockExecAsync = execAsync as jest.MockedFunction<typeof execAsync>;

  const defaultBuilderOptions: VersionBuilderSchema = {
    dryRun: false,
    noVerify: false,
    useDeps: false,
    push: false,
    remote: 'origin',
    baseBranch: 'main',
    skipRootChangelog: false,
    syncVersions: false,
    postTargets: [],
  };

  const commonWorkspaceFiles: [string, string][] = [
    ['package.json', JSON.stringify({ version: '0.0.0' })],
    [
      'workspace.json',
      JSON.stringify({
        projects: {
          workspace: {
            root: '.',
          },
          a: {
            root: 'packages/a',
          },
          b: {
            root: 'packages/b',
          },
          c: {
            root: 'packages/c',
          },
          d: {
            root: 'libs/d',
          },
          e: {
            root: 'libs/e',
          }
        },
      }),
    ],
    ['packages/a/.gitkeep', ''],
    /* "a" has a package.json */
    ['packages/a/package.json', JSON.stringify({ version: '0.0.0' })],
    /* but "b" doesn't. */
    ['packages/b/.gitkeep', ''],
    ['packages/c/.gitkeep', ''],
    /* "a" has a package.json */
    ['packages/c/package.json', JSON.stringify({ version: '0.0.0' })],
    ['libs/d/.gitkeep', ''],
    ['libs/e/.gitkeep', ''],
  ];

  let result: { success: boolean };
  let testingWorkspace: TestingWorkspace;

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();

    /* This will mock execAsync ONLY when we're getting the project graph. */
    const originalExecAsyncModule = jest.requireActual('./utils/exec-async');
    mockExecAsync.mockImplementation((cmd, args) => {
      if (cmd === 'npm' && args.join(' ') === 'run -s nx print-affected') {
        return projectGraph();
      }
      return originalExecAsyncModule.execAsync(cmd, args);
    })
  });
  afterAll(() => (console.info as jest.Mock).mockRestore());

  describe('package "a" with (--sync-versions=false)', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();

      /* Run builder. */
      result = await version(
        defaultBuilderOptions,
        createFakeContext({
          project: 'a',
          projectRoot: resolve(testingWorkspace.root, 'packages/a'),
          workspaceRoot: testingWorkspace.root,
        })
      );
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should commit all changes', () => {
      expect(uncommitedChanges()).toHaveLength(0);
    });

    it('should not bump root package.json', async () => {
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual('0.0.0');
    });

    it(`should bump a's package.json`, async () => {
      expect((await lastValueFrom(readPackageJson('packages/a'))).version).toEqual(
        '0.1.0'
      );
    });

    it('should not generate root changelog', () => {
      expect(fileExists('CHANGELOG.md')).toBe(false);
    });

    it(`should generate "a"'s changelog`, async () => {
      expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

# 0.1.0 \\(.*\\)


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );
    });
  });

  describe('package "b" with (--sync-versions=false)', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();

      /* Run builder. */
      result = await version(
        defaultBuilderOptions,
        createFakeContext({
          project: 'b',
          projectRoot: resolve(testingWorkspace.root, 'packages/b'),
          workspaceRoot: testingWorkspace.root,
        })
      );
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should commit all changes', () => {
      expect(uncommitedChanges()).toHaveLength(0);
    });

    it('should not bump root package.json', async () => {
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual('0.0.0');
    });

    it('should not generate root changelog', () => {
      expect(fileExists('CHANGELOG.md')).toBe(false);
    });

    it(`should generate "b"'s changelog`, async () => {
      expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

## 0.0.1 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
$`)
      );
    });
  });

  describe('workspace with --sync-versions=true (--root-changelog=true)', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();

      /* Run builder. */
      result = await version(
        {
          ...defaultBuilderOptions,
          syncVersions: true,
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      );
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should commit all changes', () => {
      expect(uncommitedChanges()).toHaveLength(0);
    });

    it('should bump root package.json', async () => {
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual('0.1.0');
    });

    it(`should bump "a"'s package.json`, async () => {
      expect((await lastValueFrom(readPackageJson('packages/a'))).version).toEqual(
        '0.1.0'
      );
    });

    it('should generate root changelog', async () => {
      expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

# 0.1.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );
    });

    it('should generate sub-changelogs', async () => {
      expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

# 0.1.0 \\(.*\\)


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );

      expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

# 0.1.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
$`)
      );
    });
  });

  describe('on workspace with --sync-versions=true (--root-changelog=true), after changing lib "b"', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();

      /* Run builder. */
      await version(
        {
          ...defaultBuilderOptions,
          syncVersions: true,
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      );

      /* Change b and commit. */
      execSync(`
        echo b > packages/b/b
        git add packages/b/b
        git commit -m "feat(b): b"
      `);

      result = await version(
        {
          ...defaultBuilderOptions,
          syncVersions: true,
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      );
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should commit all changes', () => {
      expect(uncommitedChanges()).toHaveLength(0);
    });

    it('should bump root package.json', async () => {
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual('0.2.0');
    });

    /* In sync mode, we bump "a" even if change concerns "b". */
    it(`should bump "a"'s package.json`, async () => {
      expect((await lastValueFrom(readPackageJson('packages/a'))).version).toEqual(
        '0.2.0'
      );
    });

    it('should update root changelog', async () => {
      expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`
# \\[0.2.0\\]\\(/compare/v0.1.0...v0.2.0\\) \\(.*\\)


### Features

\\* \\*\\*b:\\*\\* b .*



# 0.1.0 \\(.*\\)
`)
      );
    });

    it(`should update "a"'s changelog without listing "b"'s feature`, async () => {
      expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`
# \\[0.2.0\\]\\(/compare/v0.1.0...v0.2.0\\) \\(.*\\)



# 0.1.0 \\(.*\\)
`)
      );
    });

    it(`should update "b"'s changelog with new feature`, async () => {
      expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`
# \\[0.2.0\\]\\(/compare/v0.1.0...v0.2.0\\) \\(.*\\)


### Features

\\* \\*\\*b:\\*\\* b .*



# 0.1.0 \\(.*\\)
`)
      );
    });
  });

  describe('workspace with --sync-versions=true --root-changelog=false`', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();

      /* Run builder. */
      result = await version(
        {
          ...defaultBuilderOptions,
          skipRootChangelog: true,
          syncVersions: true,
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      );
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should commit all changes', () => {
      expect(uncommitedChanges()).toHaveLength(0);
    });

    it('should bump root package.json', async () => {
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual('0.1.0');
    });

    it(`should bump "a"'s package.json`, async () => {
      expect((await lastValueFrom(readPackageJson('packages/a'))).version).toEqual(
        '0.1.0'
      );
    });

    it('should not generate root changelog', () => {
      expect(fileExists('CHANGELOG.md')).toBe(false);
    });

    it('should generate sub-changelogs', async () => {
      expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

# 0.1.0 \\(.*\\)


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );

      expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

# 0.1.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
$`)
      );
    });
  });

  describe('option --use-deps', () => {

    describe('when disabled with an unchanged project', () => {
      beforeAll(async () => {
        testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

        /* Commit changes. */
        commitChanges();

        /* Run builder. */
        result = await version(
          {
            ...defaultBuilderOptions,
            useDeps: false,
          },
          createFakeContext({
            project: 'c',
            projectRoot: resolve(testingWorkspace.root, 'packages/c'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {project: 'e', projectRoot: resolve(testingWorkspace.root, 'libs/e')}
            ]
          })
        );
      });

      afterAll(() => testingWorkspace.tearDown());

      it('should not get affected projects',  () => {
        expect(mockExecAsync).not.toHaveBeenCalledWith('npm', ['run', '-s', 'nx print-affected']);
      });

      it('should not generate changelogs', () => {
        expect(existsSync('packages/c/CHANGELOG.md')).toBeFalse();
      });
    });

    /*
      The workspace is set up with the following dependencies and state:
      package a depends on lib d
      package c depends on lib e
      packages a, b, and lib d have changes
      package c is unchanged
     */
    describe('used with unchanged package with unchanged libs', () => {
      beforeAll(async () => {
        testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

        /* Commit changes. */
        commitChanges();

        /* Run builder. */
        result = await version(
          {
            ...defaultBuilderOptions,
            syncVersions: false,
            useDeps: true,
          },
          createFakeContext({
            project: 'c',
            projectRoot: resolve(testingWorkspace.root, 'packages/c'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {project: 'e', projectRoot: resolve(testingWorkspace.root, 'libs/e')}
            ]
          })
        );
      });

      afterAll(() => testingWorkspace.tearDown());

      it('should get affected projects',  () => {
        expect(mockExecAsync).toHaveBeenCalledWith('npm', ['run', '-s', 'nx print-affected']);
      });

      it('should not generate changelogs', async () => {
        expect(existsSync('packages/c/CHANGELOG.md')).toBeFalse();
      });
    });

    describe('used with unchanged package with changed lib', () => {
      beforeAll(async () => {
        testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

        /* Commit changes. */
        commitChanges();

        execSync(`
            echo e > libs/e/e.txt
            git add .
            # This does not directly fix a single package.
            git commit -m "fix: 🐞 fix emptiness"
        `);

        /* Run builder. */
        result = await version(
          {
            ...defaultBuilderOptions,
            syncVersions: false,
            useDeps: true,
          },
          createFakeContext({
            project: 'c',
            projectRoot: resolve(testingWorkspace.root, 'packages/c'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {project: 'e', projectRoot: resolve(testingWorkspace.root, 'libs/e')}
            ]
          })
        );
      });

      afterAll(() => testingWorkspace.tearDown());

      it('should get affected projects',  () => {
        expect(mockExecAsync).toHaveBeenCalledWith('npm', ['run', '-s', 'nx print-affected']);
      });

      it('generates change logs', () => {
        expect(readFileSync('packages/c/CHANGELOG.md', 'utf-8')).toMatch(
          new RegExp(`^# Changelog.*

This file was generated.*

## 0.0.1 \\(.*\\)
$`)
        );
      });
    });

    describe('used with changed package with changed lib', () => {
      beforeAll(async () => {
        testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

        /* Commit changes. */
        commitChanges();

        execSync(`
            echo c > packages/c/c.txt
            git add .
            git commit -m "feat(c): 🚀 new feature"
            echo e > libs/e/e.txt
            git add .
            # This does not directly fix a single package.
            git commit -m "feat: 🐞 fix emptiness"
        `);

        /* Run builder. */
        result = await version(
          {
            ...defaultBuilderOptions,
            syncVersions: false,
            useDeps: true,
          },
          createFakeContext({
            project: 'c',
            projectRoot: resolve(testingWorkspace.root, 'packages/c'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {project: 'e', projectRoot: resolve(testingWorkspace.root, 'libs/e')}
            ]
          })
        );
      });

      afterAll(() => testingWorkspace.tearDown());

      it('should get affected projects',  () => {
        expect(mockExecAsync).toHaveBeenCalledWith('npm', ['run', '-s', 'nx print-affected']);
      });

      it('generates change logs', () => {
        expect(readFileSync('packages/c/CHANGELOG.md', 'utf-8')).toMatch(
          new RegExp(`^# Changelog

This file was generated.*

# 0.1.0 \\(.*\\)


### Features

\\* \\*\\*c:\\*\\* 🚀 new feature .*
$`)
        );
      });
    });

    describe('used with changed package with unchanged lib', () => {
      beforeAll(async () => {
        testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

        /* Commit changes. */
        commitChanges();

        /* Run builder. */
        result = await version(
          {
            ...defaultBuilderOptions,
            syncVersions: false,
            useDeps: true,
          },
          createFakeContext({
            project: 'a',
            projectRoot: resolve(testingWorkspace.root, 'packages/a'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {project: 'd', projectRoot: resolve(testingWorkspace.root, 'libs/d')}
            ]
          })
        );
      });

      afterAll(() => testingWorkspace.tearDown());

      it('should get affected projects',  () => {
        expect(mockExecAsync).toHaveBeenCalledWith('npm', ['run', '-s', 'nx print-affected']);
      });

      it('generates change logs', () => {
        expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
          new RegExp(`^# Changelog

This file was generated.*

# 0.1.0 \\(.*\\)


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
        );
      });
    });

    describe('used with unchanged package with changed lib (--sync-versions=true)', () => {
      beforeAll(async () => {
        testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

        /* Commit changes. */
        commitChanges();

        execSync(`
            echo e > libs/e/e.txt
            git add .
            # This does not directly fix a single package.
            git commit -m "fix: 🐞 fix emptiness"
        `);

        /* Run builder. */
        result = await version(
          {
            ...defaultBuilderOptions,
            syncVersions: true,
            useDeps: true,
          },
          createFakeContext({
            project: 'c',
            projectRoot: resolve(testingWorkspace.root, 'packages/c'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {project: 'e', projectRoot: resolve(testingWorkspace.root, 'libs/e')}
            ]
          })
        );
      });

      afterAll(() => testingWorkspace.tearDown());

      it('should get affected projects',  () => {
        expect(mockExecAsync).toHaveBeenCalledWith('npm', ['run', '-s', 'nx print-affected']);
      });

      it('generates change logs', () => {
        expect(readFileSync('packages/c/CHANGELOG.md', 'utf-8')).toMatch(
          new RegExp(`^# Changelog.*

This file was generated.*

## 0.0.1 \\(.*\\).*
`)
        );
      });
    });
  });

  describe('workspace with --version=major', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();

      /* Run builder. */
      result = await version(
        {
          ...defaultBuilderOptions,
          syncVersions: true,
          version: 'major',
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      );
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should commit all changes', () => {
      expect(uncommitedChanges()).toHaveLength(0);
    });

    it('should bump root package.json', async () => {
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual('1.0.0');
    });

    it(`should bump "a"'s package.json`, async () => {
      expect((await lastValueFrom(readPackageJson('packages/a'))).version).toEqual(
        '1.0.0'
      );
    });

    it('should generate root changelog', async () => {
      expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

# 1.0.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );
    });

    it('should generate sub-changelogs', async () => {
      expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

# 1.0.0 \\(.*\\)


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );

      expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

# 1.0.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
$`)
      );
    });
  });

  describe('workspace with --version=prerelease --preid=beta', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();

      /* Run builder. */
      result = await version(
        {
          ...defaultBuilderOptions,
          syncVersions: true,
          version: 'prerelease',
          preid: 'beta',
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      );
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should commit all changes', () => {
      expect(uncommitedChanges()).toHaveLength(0);
    });

    it('should bump root package.json', async () => {
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual(
        '0.0.1-beta.0'
      );
    });

    it(`should bump "a"'s package.json`, async () => {
      expect((await lastValueFrom(readPackageJson('packages/a'))).version).toEqual(
        '0.0.1-beta.0'
      );
    });

    it('should generate root changelog', async () => {
      expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

## 0.0.1-beta.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );
    });

    it('should generate sub-changelogs', async () => {
      expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

## 0.0.1-beta.0 \\(.*\\)


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );

      expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

## 0.0.1-beta.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
$`)
      );
    });
  });

  describe('--changelog-header', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();

      /* Run builder. */
      result = await version(
        {
          ...defaultBuilderOptions,
          changelogHeader: '# Custom changelog header \n',
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      );
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should generate changelogs with custom header', () => {
      expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Custom changelog header *`)
      );
    });
  });
});

function commitChanges() {
  execSync(
    `
        git init

        # These are needed by CI.
        git config user.email "bot@jest.io"
        git config user.name "Test Bot"
        git config commit.gpgsign false
        git add .

        git commit -m "🐣"
        echo a > packages/a/a.txt
        git add .
        git commit -m "feat(a): 🚀 new feature"
        echo b > packages/b/b.txt
        git add .
        git commit -m "fix(b): 🐞 fix emptiness"
      `
  );
}

function uncommitedChanges() {
  return (
    execSync('git status --porcelain', { encoding: 'utf-8' })
      .split('\n')
      /* Remove empty line. */
      .filter((line) => line.length !== 0)
  );
}

function projectGraph() {
  // package a depends on lib d
  // package c depends on lib e
  const stdout = JSON.stringify({
    tasks: [],
    projects: ['a', 'b'],
    projectGraph: {
      nodes: ['a', 'b', 'c', 'd', 'e', 'npm:@mock/npm-lib1', 'npm:@mock/npm-lib2'],
      dependencies: {
        a: [
          {
            type: 'static',
            source: 'a',
            target: 'npm:@mock/npm-lib1',
          },
          {
            type: 'implicit',
            source: 'a',
            target: 'd',
          }
        ],
        c: [
          {
            type: 'static',
            source: 'c',
            target: 'npm:@mock/npm-lib1',
          },
          {
            type: 'implicit',
            source: 'c',
            target: 'e',
          },
        ],
        d: [],
        e: []
      },
    },
  });
  return of({stdout, stderr: ''});
}
