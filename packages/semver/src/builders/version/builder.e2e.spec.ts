import { BuilderOutput } from '@angular-devkit/architect';
import { fileExists } from '@nrwl/nx-plugin/testing';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { _enableWip, runBuilder } from './builder';
import { VersionBuilderSchema } from './schema';
import {
  createFakeContext,
  setupTestingWorkspace,
  TestingWorkspace,
} from './testing';
import { readPackageJson } from './utils/project';

// @todo get rid of this
_enableWip();

describe('@jscutlery/semver:version', () => {
  const defaultBuilderOptions: VersionBuilderSchema = {
    dryRun: false,
    noVerify: false,
    push: false,
    remote: 'origin',
    baseBranch: 'main',
    rootChangelog: true,
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

  let result: BuilderOutput;
  let testingWorkspace: TestingWorkspace;

  beforeAll(() => jest.spyOn(console, 'info').mockImplementation());
  afterAll(() => (console.info as jest.Mock).mockRestore());

  describe('package "a" with (--sync-versions=false)', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();

      /* Run builder. */
      result = await runBuilder(
        defaultBuilderOptions,
        createFakeContext({
          project: 'a',
          projectRoot: resolve(testingWorkspace.root, 'packages/a'),
          workspaceRoot: testingWorkspace.root,
        })
      ).toPromise();
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should not bump root package.json', async () => {
      expect((await readPackageJson('.').toPromise()).version).toEqual('0.0.0');
    });

    xit(`🚧 should bump a's package.json`, async () => {
      expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
        '0.1.0'
      );
    });

    it('should not generate root changelog', () => {
      expect(fileExists('CHANGELOG.md')).toBe(false);
    });

    xit(`🚧 should generate "a"'s changelog`, async () => {
      expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

All notable changes to this project will be documented in this file. See .* for commit guidelines.

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
      result = await runBuilder(
        defaultBuilderOptions,
        createFakeContext({
          project: 'b',
          projectRoot: resolve(testingWorkspace.root, 'packages/b'),
          workspaceRoot: testingWorkspace.root,
        })
      ).toPromise();
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should not bump root package.json', async () => {
      expect((await readPackageJson('.').toPromise()).version).toEqual('0.0.0');
    });

    it('should not generate root changelog', () => {
      expect(fileExists('CHANGELOG.md')).toBe(false);
    });

    xit(`🚧 should generate "b"'s changelog`, async () => {
      expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

All notable changes to this project will be documented in this file. See .* for commit guidelines.

# 0.0.1 \\(.*\\)


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
      result = await runBuilder(
        {
          ...defaultBuilderOptions,
          syncVersions: true,
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      ).toPromise();
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should bump root package.json', async () => {
      expect((await readPackageJson('.').toPromise()).version).toEqual('0.1.0');
    });

    it(`should bump "a"'s package.json`, async () => {
      expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
        '0.1.0'
      );
    });

    xit('🚧 should generate root changelog', async () => {
      expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

All notable changes to this project will be documented in this file. See .* for commit guidelines.

# 0.1.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );
    });

    xit('🚧 should generate sub-changelogs', async () => {
      expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

All notable changes to this project will be documented in this file. See .* for commit guidelines.

# 0.1.0 \\(.*\\)


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );

      expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

All notable changes to this project will be documented in this file. See .* for commit guidelines.

# 0.1.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
$`)
      );
    });
  });

  describe('workspace with --sync-versions=true --root-changelog=false`', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();

      /* Run builder. */
      result = await runBuilder(
        {
          ...defaultBuilderOptions,
          rootChangelog: false,
          syncVersions: true,
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      ).toPromise();
    });

    afterAll(() => testingWorkspace.tearDown());

    xit('🚧 should return success', () => {
      expect(result).toEqual({ success: true });
    });

    xit('🚧 should bump root package.json', async () => {
      expect((await readPackageJson('.').toPromise()).version).toEqual('0.1.0');
    });

    xit(`🚧 should bump "a"'s package.json`, async () => {
      expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
        '0.1.0'
      );
    });

    xit('🚧 should not generate root changelog', () => {
      expect(fileExists('CHANGELOG.md')).toBe(false);
    });

    xit('🚧 should generate sub-changelogs', async () => {
      expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

All notable changes to this project will be documented in this file. See .* for commit guidelines.

# 0.1.0 \\(.*\\)


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`)
      );

      expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

All notable changes to this project will be documented in this file. See .* for commit guidelines.

# 0.1.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
$`)
      );
    });
  });

  function commitChanges() {
    execSync(
      `
        git init; 

        # These are needed by CI.
        git config user.email "bot@jest.io"
        git config user.name "Test Bot"
        
        git add .; 
        git commit -m "🐣"; 
        echo a > packages/a/a.txt
        git add .
        git commit -m "feat(a): 🚀 new feature"
        echo b > packages/b/b.txt
        git add .
        git commit -m "fix(b): 🐞 fix emptiness"
      `
    );
  }
});
