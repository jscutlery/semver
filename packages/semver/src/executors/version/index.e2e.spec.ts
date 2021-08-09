import { fileExists } from '@nrwl/nx-plugin/testing';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import version from './';
import { createFakeContext, setupTestingWorkspace } from './testing';
import { readPackageJson } from './utils/project';

import type { TestingWorkspace } from './testing';
import type { VersionBuilderSchema } from './schema';

describe('@jscutlery/semver:version', () => {
  const defaultBuilderOptions: VersionBuilderSchema = {
    dryRun: false,
    noVerify: false,
    push: false,
    remote: 'origin',
    baseBranch: 'main',
    skipRootChangelog: false,
    syncVersions: false,
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
        },
      }),
    ],
    ['packages/a/.gitkeep', ''],
    /* "a" has a package.json */
    ['packages/a/package.json', JSON.stringify({ version: '0.0.0' })],
    /* but "b" doesn't. */
    ['packages/b/.gitkeep', ''],
  ];

  let result: { success: boolean };
  let testingWorkspace: TestingWorkspace;

  beforeAll(() => jest.spyOn(console, 'info').mockImplementation());
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
      expect((await readPackageJson('.').toPromise()).version).toEqual('0.0.0');
    });

    it(`should bump a's package.json`, async () => {
      expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
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
      expect((await readPackageJson('.').toPromise()).version).toEqual('0.0.0');
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
      expect((await readPackageJson('.').toPromise()).version).toEqual('0.1.0');
    });

    it(`should bump "a"'s package.json`, async () => {
      expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
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
      expect((await readPackageJson('.').toPromise()).version).toEqual('0.2.0');
    });

    /* In sync mode, we bump "a" even if change concerns "b". */
    it(`should bump "a"'s package.json`, async () => {
      expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
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
      expect((await readPackageJson('.').toPromise()).version).toEqual('0.1.0');
    });

    it(`should bump "a"'s package.json`, async () => {
      expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
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
      expect((await readPackageJson('.').toPromise()).version).toEqual('1.0.0');
    });

    it(`should bump "a"'s package.json`, async () => {
      expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
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
      expect((await readPackageJson('.').toPromise()).version).toEqual(
        '0.0.1-beta.0'
      );
    });

    it(`should bump "a"'s package.json`, async () => {
      expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
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
