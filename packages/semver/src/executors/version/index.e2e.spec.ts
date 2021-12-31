import { fileExists } from '@nrwl/nx-plugin/testing';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import version from './';
import { createFakeContext, setupTestingWorkspace } from './testing';
import { readPackageJson } from './utils/project';

import type { TestingWorkspace } from './testing';
import type { VersionBuilderSchema } from './schema';
import {
  createProjectGraphAsync,
  getSortedProjectNodes,
} from '@nrwl/workspace/src/core/project-graph';
import { lastValueFrom } from 'rxjs';
import { getProjectDependencies } from './utils/get-project-dependencies';

jest.mock('@nrwl/workspace/src/core/project-graph');

describe('@jscutlery/semver:version', () => {
  const defaultBuilderOptions: VersionBuilderSchema = {
    dryRun: false,
    noVerify: false,
    trackDeps: false,
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
          },
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
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual(
        '0.0.0'
      );
    });

    it(`should bump a's package.json`, async () => {
      expect(
        (await lastValueFrom(readPackageJson('packages/a'))).version
      ).toEqual('0.1.0');
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
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual(
        '0.0.0'
      );
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
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual(
        '0.1.0'
      );
    });

    it(`should bump "a"'s package.json`, async () => {
      expect(
        (await lastValueFrom(readPackageJson('packages/a'))).version
      ).toEqual('0.1.0');
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
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual(
        '0.2.0'
      );
    });

    /* In sync mode, we bump "a" even if change concerns "b". */
    it(`should bump "a"'s package.json`, async () => {
      expect(
        (await lastValueFrom(readPackageJson('packages/a'))).version
      ).toEqual('0.2.0');
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
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual(
        '0.1.0'
      );
    });

    it(`should bump "a"'s package.json`, async () => {
      expect(
        (await lastValueFrom(readPackageJson('packages/a'))).version
      ).toEqual('0.1.0');
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

  describe('option --track-deps', () => {
    /**
     * Ideally, these would not be mocked in an e2e test, but in order to truly
     * test its use in `getProjectDependencies`, it would require a full NX workspace
     * testing environment with interdependent projects.
     */
    const mockCreateProjectGraphAsync =
      createProjectGraphAsync as jest.MockedFunction<
        typeof createProjectGraphAsync
      >;
    const mockGetSortedProjectNodes =
      getSortedProjectNodes as jest.MockedFunction<
        typeof getSortedProjectNodes
      >;

    describe('utilizes the project graph', () => {
      beforeEach(() => {
        const originalModule = jest.requireActual(
          '@nrwl/workspace/src/core/project-graph'
        );
        mockCreateProjectGraphAsync.mockImplementation(
          originalModule.createProjectGraphAsync
        );
        mockGetSortedProjectNodes.mockImplementation(
          originalModule.getSortedProjectNodes
        );
      });
      afterEach(() => jest.resetAllMocks());

      it('uses a valid project graph version', async () => {
        await expect(getProjectDependencies('semver')).resolves.not.toThrow();
        /** If this failed, then the pinned version of the project graph
         * is no longer supported for the current version of NX. The version should
         * be bumped and the tests should be run against an example of the updated
         * project graph.
         */
      });
    });

    describe('when disabled with an unchanged project', () => {
      beforeAll(async () => {
        mockCreateProjectGraphAsync.mockReturnValue(projectGraph());

        testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

        /* Commit changes. */
        commitChanges();

        /* Run builder. */
        result = await version(
          {
            ...defaultBuilderOptions,
            trackDeps: false,
          },
          createFakeContext({
            project: 'c',
            projectRoot: resolve(testingWorkspace.root, 'packages/c'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {
                project: 'e',
                projectRoot: resolve(testingWorkspace.root, 'libs/e'),
              },
            ],
          })
        );
      });

      afterAll(() => {
        mockCreateProjectGraphAsync.mockRestore();
        return testingWorkspace.tearDown();
      });

      it('should not get affected projects', () => {
        expect(mockCreateProjectGraphAsync).toHaveBeenCalledTimes(0);
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
        mockCreateProjectGraphAsync.mockReturnValue(projectGraph());

        testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

        /* Commit changes. */
        commitChanges();

        /* Run builder. */
        result = await version(
          {
            ...defaultBuilderOptions,
            syncVersions: false,
            trackDeps: true,
          },
          createFakeContext({
            project: 'c',
            projectRoot: resolve(testingWorkspace.root, 'packages/c'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {
                project: 'e',
                projectRoot: resolve(testingWorkspace.root, 'libs/e'),
              },
            ],
          })
        );
      });

      afterAll(() => {
        mockCreateProjectGraphAsync.mockRestore();
        return testingWorkspace.tearDown();
      });

      it('should get affected projects', () => {
        expect(mockCreateProjectGraphAsync).toHaveBeenCalledTimes(1);
      });

      it('should not generate changelogs', async () => {
        expect(existsSync('packages/c/CHANGELOG.md')).toBeFalse();
      });
    });

    describe('used with unchanged package with changed lib', () => {
      beforeAll(async () => {
        mockCreateProjectGraphAsync.mockReturnValue(projectGraph());

        testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

        /* Commit changes. */
        commitChanges();

        execSync(`
            echo e > libs/e/e.txt
            git add .
            # This does not directly add a feature to a single package.
            git commit -m "feat: 🚀 new feature"
        `);

        /* Run builder. */
        result = await version(
          {
            ...defaultBuilderOptions,
            syncVersions: false,
            trackDeps: true,
          },
          createFakeContext({
            project: 'c',
            projectRoot: resolve(testingWorkspace.root, 'packages/c'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {
                project: 'e',
                projectRoot: resolve(testingWorkspace.root, 'libs/e'),
              },
            ],
          })
        );
      });

      afterAll(() => {
        mockCreateProjectGraphAsync.mockRestore();
        return testingWorkspace.tearDown();
      });

      it('should get affected projects', () => {
        expect(mockCreateProjectGraphAsync).toHaveBeenCalledTimes(1);
      });

      it('generates change logs', () => {
        expect(readFileSync('packages/c/CHANGELOG.md', 'utf-8')).toMatch(
          new RegExp(`^# Changelog

This file was generated.*

## 0.0.1 \\(.*\\)

### Dependency Updates

\\* \`e\` updated to version \`0.1.0\`
$`)
        );
      });
    });

    describe('used with changed package with changed lib', () => {
      beforeAll(async () => {
        mockCreateProjectGraphAsync.mockReturnValue(projectGraph());

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
            trackDeps: true,
          },
          createFakeContext({
            project: 'c',
            projectRoot: resolve(testingWorkspace.root, 'packages/c'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {
                project: 'e',
                projectRoot: resolve(testingWorkspace.root, 'libs/e'),
              },
            ],
          })
        );
      });

      afterAll(() => {
        mockCreateProjectGraphAsync.mockRestore();
        return testingWorkspace.tearDown();
      });

      it('should get affected projects', () => {
        expect(mockCreateProjectGraphAsync).toHaveBeenCalledTimes(1);
      });

      it('generates change logs', async () => {
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
        mockCreateProjectGraphAsync.mockReturnValue(projectGraph());

        testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

        /* Commit changes. */
        commitChanges();

        /* Run builder. */
        result = await version(
          {
            ...defaultBuilderOptions,
            syncVersions: false,
            trackDeps: true,
          },
          createFakeContext({
            project: 'a',
            projectRoot: resolve(testingWorkspace.root, 'packages/a'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {
                project: 'd',
                projectRoot: resolve(testingWorkspace.root, 'libs/d'),
              },
            ],
          })
        );
      });

      afterAll(() => {
        mockCreateProjectGraphAsync.mockRestore();
        return testingWorkspace.tearDown();
      });

      it('should get affected projects', () => {
        expect(mockCreateProjectGraphAsync).toHaveBeenCalledTimes(1);
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
        mockCreateProjectGraphAsync.mockReturnValue(projectGraph());

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
        await version(
          {
            ...defaultBuilderOptions,
            syncVersions: true,
            trackDeps: true,
          },
          createFakeContext({
            project: 'c',
            projectRoot: resolve(testingWorkspace.root, 'packages/c'),
            workspaceRoot: testingWorkspace.root,
            additionalProjects: [
              {
                project: 'e',
                projectRoot: resolve(testingWorkspace.root, 'libs/e'),
              },
            ],
          })
        );
      });

      afterAll(() => {
        mockCreateProjectGraphAsync.mockRestore();
        return testingWorkspace.tearDown();
      });

      it('should get affected projects', () => {
        expect(mockCreateProjectGraphAsync).toHaveBeenCalledTimes(1);
      });

      it('generates change logs', async () => {
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
      expect((await lastValueFrom(readPackageJson('.'))).version).toEqual(
        '1.0.0'
      );
    });

    it(`should bump "a"'s package.json`, async () => {
      expect(
        (await lastValueFrom(readPackageJson('packages/a'))).version
      ).toEqual('1.0.0');
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
      expect(
        (await lastValueFrom(readPackageJson('packages/a'))).version
      ).toEqual('0.0.1-beta.0');
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

  describe('--commitMessageFormat', () => {
    beforeEach(async () => {
      testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

      /* Commit changes. */
      commitChanges();
    });

    afterEach(() => testingWorkspace.tearDown());

    it('should have the latest commit following the provided format', async () => {
      result = await version(
        {
          ...defaultBuilderOptions,
          commitMessageFormat: 'chore: 🎸 release ${version} [skip ci]',
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      );

      expect(commitMessage()).toBe('chore: 🎸 release 0.1.0 [skip ci]');
    });

    it('should have the latest commit following the default format', async () => {
      result = await version(
        defaultBuilderOptions,
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
        })
      );

      expect(commitMessage()).toBe('chore(release): 0.1.0');
    });
  });

  // The testing workspace isn't really configured for
  // executors, perhaps using the `new FSTree()` from
  // and `new Workspace()` @nrwl/toa would give a
  // more suitable test environment
  xdescribe('workspace with postTargets', () => {
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
          postTargets: ['e:github'],
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
          workspaceRoot: testingWorkspace.root,
          additionalProjects: [
            {
              project: 'e',
              projectRoot: './libs/e',
              targets: {
                github: {
                  executor: '@nrwl/workspace:run-script',
                  options: {
                    script: 'echo ${notes}',
                  },
                },
              },
            },
          ],
        })
      );
    });

    afterAll(() => testingWorkspace.tearDown());

    it.todo('should pass in only the new lines from the changelog as ${notes}');
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

function commitMessage() {
  return execSync('git show -s --format=%s', { encoding: 'utf-8' }).trim();
}

function projectGraph() {
  // package a depends on lib d
  // package c depends on lib e
  return Promise.resolve({
    nodes: {},
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
        },
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
      e: [],
    },
  });
}
