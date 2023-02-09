import type { ExecutorContext } from '@nrwl/devkit';
import { logger } from '@nrwl/devkit';
import { of, throwError } from 'rxjs';
import version from './';
import type { VersionBuilderSchema } from './schema';
import { createFakeContext } from './testing';
import * as changelog from './utils/changelog';
import { defaultHeader } from './utils/changelog';
import * as commit from './utils/commit';
import { getDependencyRoots } from './utils/get-project-dependencies';
import * as git from './utils/git';
import { runPostTargets } from './utils/post-target';
import * as project from './utils/project';
import { tryBump } from './utils/try-bump';
import * as workspace from './utils/workspace';
const LAST_COMMIT_HASH = 'lastCommitHash';
jest.mock('./utils/changelog');
jest.mock('./utils/project');
jest.mock('./utils/commit', () => ({
  commit: jest.fn(),
  formatCommitMessage: jest.requireActual('./utils/commit').formatCommitMessage,
}));
jest.mock('./utils/git');
jest.mock('./utils/get-project-dependencies');
jest.mock('./utils/try-bump');
jest.mock('./utils/post-target');

describe('@jscutlery/semver:version', () => {
  const mockUpdatePackageJson =
    project.updatePackageJson as jest.MockedFunction<
      typeof project.updatePackageJson
    >;
  const mockUpdateChangelog = changelog.updateChangelog as jest.MockedFunction<
    typeof changelog.updateChangelog
  >;
  const mockInsertChangelogDependencyUpdates =
    changelog.insertChangelogDependencyUpdates as jest.MockedFunction<
      typeof changelog.insertChangelogDependencyUpdates
    >;
  const mockCalculateChangelogChanges =
    changelog.calculateChangelogChanges as jest.MockedFunction<
      typeof changelog.calculateChangelogChanges
    >;
  const mockTryPush = git.tryPush as jest.MockedFunction<typeof git.tryPush>;
  const mockGetLastCommitHash = git.getLastCommitHash as jest.MockedFunction<
    typeof git.getLastCommitHash
  >;
  const mockAddToStage = git.addToStage as jest.MockedFunction<
    typeof git.addToStage
  >;
  const mockCommit = commit.commit as jest.MockedFunction<typeof commit.commit>;
  const mockCreateTag = git.createTag as jest.MockedFunction<
    typeof git.createTag
  >;
  const mockTryBump = tryBump as jest.MockedFunction<typeof tryBump>;
  const mockGetDependencyRoots = getDependencyRoots as jest.MockedFunction<
    typeof getDependencyRoots
  >;
  const mockRunPostTargets = runPostTargets as jest.MockedFunction<
    typeof runPostTargets
  >;

  let context: ExecutorContext;

  const options: VersionBuilderSchema = {
    dryRun: false,
    trackDeps: false,
    noVerify: false,
    push: false,
    remote: 'origin',
    baseBranch: 'main',
    syncVersions: false,
    skipRootChangelog: false,
    skipProjectChangelog: false,
    postTargets: [],
    preset: 'angular',
    commitMessageFormat: 'chore(${projectName}): release version ${version}',
  };

  beforeEach(() => {
    context = createFakeContext({
      project: 'a',
      projectRoot: '/root/packages/a',
      workspaceRoot: '/root',
      additionalProjects: [
        {
          project: 'lib1',
          projectRoot: '/root/libs/lib1',
        },
        {
          project: 'lib2',
          projectRoot: '/root/libs/lib2',
        },
      ],
    });

    jest.spyOn(logger, 'info');
    jest.spyOn(logger, 'error');
    jest.spyOn(logger, 'log').mockImplementation();

    mockTryBump.mockReturnValue(
      of({ version: '2.1.0', previousVersion: '2.0.0', dependencyUpdates: [] })
    );
    mockUpdateChangelog.mockImplementation(({ projectRoot }) =>
      of(changelog.getChangelogPath(projectRoot))
    );
    mockUpdatePackageJson.mockImplementation(({ projectRoot }) =>
      of(project.getPackageJsonPath(projectRoot))
    );
    mockCalculateChangelogChanges.mockReturnValue((source) => {
      source.subscribe();
      return of('');
    });
    mockInsertChangelogDependencyUpdates.mockReturnValue(of(''));

    /* Mock Git execution */
    mockTryPush.mockReturnValue(of(''));

    mockGetLastCommitHash.mockReturnValue(of(LAST_COMMIT_HASH));
    mockAddToStage.mockReturnValue(of(undefined));
    mockCommit.mockReturnValue(of(undefined));
    mockCreateTag.mockReturnValue(of(''));

    mockRunPostTargets.mockReturnValue(of(undefined));
    mockGetDependencyRoots.mockReturnValue(Promise.resolve([]));

    jest
      .spyOn(workspace, 'getProjectRoots')
      .mockReturnValue([
        '/root/packages/a',
        '/root/packages/b',
        '/root/libs/lib1',
        '/root/libs/lib2',
      ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should run tasks in order', async () => {
    const { success } = await version(
      { ...options, push: true, postTargets: ['a:publish'] },
      context
    );
    expect(success).toBe(true);
    expect(mockTryBump).toHaveBeenCalledBefore(
      mockUpdateChangelog as jest.Mock
    );
    expect(mockUpdateChangelog).toHaveBeenCalledBefore(
      mockUpdatePackageJson as jest.Mock
    );
    expect(mockCommit).toHaveBeenCalledBefore(mockCreateTag as jest.Mock);
    expect(mockCreateTag).toHaveBeenCalledBefore(mockTryPush as jest.Mock);
    expect(mockTryPush).toHaveBeenCalledBefore(mockRunPostTargets as jest.Mock);
  });

  it('should version with --releaseAs', async () => {
    const { success } = await version(
      { ...options, releaseAs: 'major' },
      context
    );
    expect(success).toBe(true);
    expect(mockTryBump).toBeCalledWith(
      expect.objectContaining({
        releaseType: 'major',
      })
    );
    expect(mockUpdateChangelog).toBeCalledWith(
      expect.objectContaining({ newVersion: '2.1.0' })
    );
    expect(mockUpdatePackageJson).toBeCalledWith(
      expect.objectContaining({ newVersion: '2.1.0' })
    );
    expect(mockCommit).toBeCalledWith(
      expect.objectContaining({
        commitMessage: 'chore(a): release version 2.1.0',
      })
    );
    expect(mockCreateTag).toBeCalledWith(
      expect.objectContaining({ tag: 'a-2.1.0' })
    );
  });

  it('should version with --noVerify', async () => {
    const { success } = await version({ ...options, noVerify: true }, context);
    expect(success).toBe(true);
    expect(mockCommit).toBeCalledWith(
      expect.objectContaining({ noVerify: true })
    );
  });

  it('should skip changelog and package.json update with --dryRun', async () => {
    const { success } = await version(
      {
        ...options,
        dryRun: true,
      },
      context
    );

    expect(success).toBe(true);
    expect(mockUpdatePackageJson).toBeCalledWith(
      expect.objectContaining({ dryRun: true })
    );
    expect(mockUpdateChangelog).toBeCalledWith(
      expect.objectContaining({ dryRun: true })
    );
  });

  describe('--skipCommit', () => {
    it('should not make a commit', async () => {
      const { success } = await version(
        {
          ...options,
          skipCommit: true,
        },
        context
      );

      expect(success).toBe(true);
      expect(mockCommit).toBeCalledWith(
        expect.objectContaining({ skipCommit: true })
      );
    });

    it('should put tag on last commit in a library', async () => {
      const { success } = await version(
        {
          ...options,
          skipCommit: true,
        },
        context
      );

      expect(success).toBe(true);
      expect(mockCreateTag).toBeCalledWith(
        expect.objectContaining({ commitHash: LAST_COMMIT_HASH })
      );
    });
  });

  describe('--syncVersions=false (independent mode)', () => {
    it('should run semver independently on a project', async () => {
      const { success } = await version(options, context);

      expect(success).toBe(true);
      expect(mockTryBump).toBeCalledWith(
        expect.objectContaining({
          dependencyRoots: [],
        })
      );
      expect(mockUpdateChangelog).toBeCalledWith(
        expect.objectContaining({ newVersion: '2.1.0' })
      );
      expect(mockUpdatePackageJson).toBeCalledWith(
        expect.objectContaining({ newVersion: '2.1.0' })
      );
      expect(mockCommit).toBeCalledWith(
        expect.objectContaining({
          commitMessage: 'chore(a): release version 2.1.0',
        })
      );
      expect(mockCreateTag).toBeCalledWith(
        expect.objectContaining({ tag: 'a-2.1.0' })
      );
    });

    it('should run semver independently on a project with dependencies', async () => {
      mockGetDependencyRoots.mockReturnValue(
        Promise.resolve([
          { name: 'lib1', path: '/root/libs/lib1' },
          { name: 'lib2', path: '/root/libs/lib2' },
        ])
      );
      const { success } = await version(
        { ...options, trackDeps: true },
        context
      );

      expect(success).toBe(true);
      expect(mockTryBump).toBeCalledWith(
        expect.objectContaining({
          dependencyRoots: [
            { name: 'lib1', path: '/root/libs/lib1' },
            { name: 'lib2', path: '/root/libs/lib2' },
          ],
        })
      );
      expect(mockUpdateChangelog).toBeCalledWith(
        expect.objectContaining({ newVersion: '2.1.0' })
      );
      expect(mockUpdatePackageJson).toBeCalledWith(
        expect.objectContaining({ newVersion: '2.1.0' })
      );
      expect(mockCommit).toBeCalledWith(
        expect.objectContaining({
          commitMessage: 'chore(a): release version 2.1.0',
        })
      );
      expect(mockCreateTag).toBeCalledWith(
        expect.objectContaining({ tag: 'a-2.1.0' })
      );
    });

    it('should run semver independently on a project with failure on dependencies', async () => {
      mockGetDependencyRoots.mockReturnValue(Promise.reject('thrown error'));

      expect(await version({ ...options, trackDeps: true }, context)).toEqual({
        success: false,
      });
      expect(logger.error).toBeCalledWith(
        expect.stringContaining('Failed to determine dependencies.')
      );
      expect(mockUpdatePackageJson).not.toBeCalled();
      expect(mockCommit).not.toBeCalled();
      expect(mockCreateTag).not.toBeCalled();
    });

    it('should resolve ${projectName} tagPrefix interpolation', async () => {
      const { success } = await version(
        { ...options, tagPrefix: 'custom-tag-prefix/${projectName}-' },
        context
      );

      expect(success).toBe(true);
      expect(mockCreateTag).toBeCalledWith(
        expect.objectContaining({
          tag: 'custom-tag-prefix/a-2.1.0',
        })
      );
    });

    it('should not version if no commits since last release', async () => {
      mockTryBump.mockReturnValue(of(null));

      const { success } = await version(options, context);

      expect(success).toBe(true);
      expect(logger.info).toBeCalledWith(
        expect.stringContaining('Nothing changed since last release.')
      );
      expect(mockUpdatePackageJson).not.toBeCalled();
      expect(mockCommit).not.toBeCalled();
      expect(mockCreateTag).not.toBeCalled();
    });

    it('should skip changelog generation with --skipProjectChangelog', async () => {
      const { success } = await version(
        { ...options, skipProjectChangelog: true },
        context
      );

      expect(success).toBe(true);
      expect(mockUpdateChangelog).not.toBeCalled();
      expect(mockUpdatePackageJson).toBeCalled();
      expect(mockCommit).toBeCalled();
      expect(mockCreateTag).toBeCalled();
    });
  });

  describe('--syncVersions', () => {
    beforeEach(() => {
      /* With the sync versions, the builder runs on the workspace. */
      context = createFakeContext({
        project: 'workspace',
        projectRoot: '/root',
        workspaceRoot: '/root',
        additionalProjects: [
          {
            project: 'a',
            projectRoot: 'packages/a',
          },
          {
            project: 'b',
            projectRoot: 'packages/b',
          },
        ],
      });

      jest
        .spyOn(workspace, 'getProjectRoots')
        .mockReturnValue(['/root/packages/a', '/root/packages/b', '/root']);
    });

    it('should commit and tag', async () => {
      const { success } = await version(
        {
          ...options,
          /* Enable sync versions. */
          syncVersions: true,
        },
        context
      );

      expect(success).toBe(true);
      expect(mockCreateTag).toBeCalledWith(
        expect.objectContaining({
          commitMessage: 'chore(workspace): release version 2.1.0',
          dryRun: false,
          projectName: 'workspace',
          tag: 'v2.1.0',
        })
      );
      expect(mockCommit).toBeCalledWith(
        expect.objectContaining({
          commitMessage: 'chore(workspace): release version 2.1.0',
          dryRun: false,
          noVerify: false,
          projectName: 'workspace',
        })
      );
    });

    it('should update package.json files', async () => {
      const { success } = await version(
        {
          ...options,
          /* Enable sync versions. */
          syncVersions: true,
        },
        context
      );

      expect(success).toBe(true);
      expect(mockUpdatePackageJson).toBeCalledTimes(3);
      expect(mockUpdatePackageJson.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          newVersion: '2.1.0',
          projectRoot: '/root/packages/a',
        })
      );
      expect(mockUpdatePackageJson.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          newVersion: '2.1.0',
          projectRoot: '/root/packages/b',
        })
      );
      expect(mockUpdatePackageJson.mock.calls[2][0]).toEqual(
        expect.objectContaining({
          newVersion: '2.1.0',
          projectRoot: '/root',
        })
      );
    });

    it('should update changelogs', async () => {
      const { success } = await version(
        {
          ...options,
          /* Enable sync versions. */
          syncVersions: true,
        },
        context
      );

      expect(success).toBe(true);
      expect(mockUpdateChangelog).toBeCalledTimes(3);
      expect(mockUpdateChangelog).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          projectRoot: '/root/packages/a',
        })
      );
      expect(mockUpdateChangelog).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          projectRoot: '/root/packages/b',
        })
      );
      expect(mockUpdateChangelog).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          projectRoot: '/root',
        })
      );
    });

    it('should skip root CHANGELOG generation with --skipRootChangelog', async () => {
      await version(
        {
          ...options,
          syncVersions: true,
          /* Disable root CHANGELOG */
          skipRootChangelog: true,
        },
        context
      );

      expect(mockUpdateChangelog).toBeCalledTimes(2);
      expect(mockUpdateChangelog).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          projectRoot: '/root/packages/a',
        })
      );
      expect(mockUpdateChangelog).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          projectRoot: '/root/packages/b',
        })
      );
    });

    it('should skip project CHANGELOG generation with --skipProjectChangelog', async () => {
      await version(
        {
          ...options,
          syncVersions: true,
          /* Disable project CHANGELOG */
          skipProjectChangelog: true,
        },
        context
      );
      expect(mockUpdateChangelog).toBeCalledTimes(1);
      expect(mockUpdateChangelog).toBeCalledWith(
        expect.objectContaining({
          projectRoot: '/root',
        })
      );
    });

    it('should not version if no commits since last release', async () => {
      mockTryBump.mockReturnValue(of(null));

      const { success } = await version(
        {
          ...options,
          syncVersions: true,
        },
        context
      );

      expect(success).toBe(true);
      expect(logger.info).toBeCalledWith(
        expect.stringContaining('Nothing changed since last release.')
      );
      expect(mockUpdateChangelog).not.toBeCalled();
      expect(mockUpdatePackageJson).not.toBeCalled();
      expect(mockAddToStage).not.toBeCalled();
      expect(mockCreateTag).not.toBeCalled();
      expect(mockCommit).not.toBeCalled();
    });
  });

  describe('--commitMessageFormat', () => {
    it('should handle given format', async () => {
      const { success } = await version(
        {
          ...options,
          commitMessageFormat:
            'chore: bump "${projectName}" to ${version} [skip ci]',
        },
        context
      );

      expect(success).toBe(true);
      expect(mockCommit).toBeCalledWith(
        expect.objectContaining({
          commitMessage: 'chore: bump "a" to 2.1.0 [skip ci]',
        })
      );
    });

    it('should commit with default format', async () => {
      const { success } = await version(options, context);

      expect(success).toBe(true);
      expect(mockCommit).toBeCalledWith(
        expect.objectContaining({
          commitMessage: 'chore(a): release version 2.1.0',
        })
      );
    });
  });

  describe('--push', () => {
    it('should push to Git', async () => {
      mockTryPush.mockReturnValue(of('success'));

      const { success } = await version({ ...options, push: true }, context);

      expect(success).toBe(true);
      expect(mockTryPush).toHaveBeenCalledWith(
        expect.objectContaining({
          remote: 'origin',
          branch: 'main',
          noVerify: false,
        })
      );
    });

    it('should handle Git failure', async () => {
      mockTryPush.mockReturnValue(
        throwError(() => new Error('Something went wrong'))
      );

      const { success } = await version({ ...options, push: true }, context);

      expect(success).toBe(false);
      expect(logger.error).toBeCalledWith(
        expect.stringContaining('Error: Something went wrong')
      );
    });

    it('should not push to Git by default', async () => {
      await version(options, context);
      expect(mockTryPush).not.toHaveBeenCalled();
    });

    it('should not push to Git when with --dryRun', async () => {
      await version({ ...options, dryRun: true }, context);
      expect(mockTryPush).not.toHaveBeenCalled();
    });
  });

  describe('--postTargets', () => {
    it('should successfully execute post targets', async () => {
      const { success } = await version(
        {
          ...options,
          postTargets: [
            'project-a:test',
            'project-b:test',
            'project-c:test:prod',
          ],
        },
        context
      );

      expect(success).toBe(true);
      expect(mockRunPostTargets).toBeCalledWith(
        expect.objectContaining({
          templateStringContext: {
            dryRun: false,
            notes: '',
            projectName: 'a',
            tag: 'a-2.1.0',
            version: '2.1.0',
            previousTag: 'a-2.0.0',
          },
        })
      );
    });

    it('should handle post targets failure', async () => {
      mockRunPostTargets.mockReturnValue(throwError(() => new Error('Nop!')));

      const { success } = await version(
        {
          ...options,
          postTargets: ['project-a:test'],
        },
        context
      );

      expect(success).toBe(false);
      expect(logger.error).toBeCalledWith(expect.stringMatching('Nop!'));
    });

    it('should skip post targets with --dryRun', async () => {
      const { success } = await version(
        {
          ...options,
          dryRun: true,
          postTargets: ['project-a:test', 'project-b:test:prod'],
        },
        context
      );

      expect(success).toBe(true);
      expect(mockRunPostTargets).not.toBeCalled();
    });

    it('should execute post targets after the bump occurred', async () => {
      const { success } = await version(
        {
          ...options,
          postTargets: ['project-a:test'],
        },
        context
      );

      expect(success).toBe(true);
      expect(mockTryBump).toHaveBeenCalledBefore(
        mockRunPostTargets as jest.Mock
      );
    });

    it('should skip executing post targets if no bump occurred', async () => {
      mockTryBump.mockReturnValue(of(null));

      const { success } = await version(
        {
          ...options,
          postTargets: ['project-a:test'],
        },
        context
      );

      expect(success).toBe(true);
      expect(mockRunPostTargets).not.toBeCalled();
    });
  });

  describe('--preset', () => {
    it('should use --preset=angular by default', async () => {
      const { success } = await version(
        { ...options, preset: undefined },
        context
      );

      expect(success).toBe(true);
      expect(mockUpdateChangelog).toBeCalledWith(
        expect.objectContaining({
          preset: 'angular',
        })
      );
    });

    it('should use --preset=conventional', async () => {
      const { success } = await version(
        { ...options, preset: 'conventional' },
        context
      );

      expect(success).toBe(true);
      expect(mockUpdateChangelog).toBeCalledWith(
        expect.objectContaining({
          preset: 'conventionalcommits',
        })
      );
    });

    it('should use --preset=conventional-changelog-config-spec', async () => {
      const { success } = await version(
        {
          ...options,
          preset: {
            name: 'conventionalcommits',
            compareUrlFormat:
              '{{host}}/{{owner}}/{{repository}}/compareee/{{previousTag}}...{{currentTag}}',
          },
        },
        context
      );

      expect(success).toBe(true);
      expect(mockUpdateChangelog).toBeCalledWith(
        expect.objectContaining({
          preset: {
            compareUrlFormat:
              '{{host}}/{{owner}}/{{repository}}/compareee/{{previousTag}}...{{currentTag}}',
            name: 'conventionalcommits',
          },
        })
      );
    });
  });

  describe('---changelogHeader', () => {
    const customChangelogHeader = `# Custom Changelog Header`;
    it('should use --changelogHeader=defaultHeader by default', async () => {
      const { success } = await version(options, context);

      expect(success).toBe(true);

      expect(mockUpdateChangelog).toBeCalledWith(
        expect.objectContaining({
          changelogHeader: defaultHeader,
        })
      );
    });
    it(`should use --changelogHeader=${customChangelogHeader} by default`, async () => {
      const { success } = await version(
        { ...options, changelogHeader: customChangelogHeader },
        context
      );

      expect(success).toBe(true);

      expect(mockUpdateChangelog).toBeCalledWith(
        expect.objectContaining({
          changelogHeader: customChangelogHeader,
        })
      );
    });
  });
});
