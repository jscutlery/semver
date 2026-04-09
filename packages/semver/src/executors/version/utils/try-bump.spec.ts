import { logger } from '@nx/devkit';
import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import * as gitSemverTags from 'git-semver-tags';
import { lastValueFrom, of, throwError } from 'rxjs';
import { getLastVersion } from './get-last-version';
import {
  getDependencyRootsFromProjectNames,
  getProjectDependencies,
} from './get-project-dependencies';
import { getCommits, getFirstCommitRef } from './git';
import { tryBump } from './try-bump';

jest.mock('conventional-recommended-bump');
jest.mock('./get-last-version');
jest.mock('./get-project-dependencies');
jest.mock('./git');
jest.mock('git-semver-tags', () => jest.fn());

describe('tryBump', () => {
  const mockConventionalRecommendedBump =
    conventionalRecommendedBump as jest.MockedFunction<
      typeof conventionalRecommendedBump
    >;
  const mockGetLastVersion = getLastVersion as jest.MockedFunction<
    typeof getLastVersion
  >;
  const mockGetProjectDependencies =
    getProjectDependencies as jest.MockedFunction<
      typeof getProjectDependencies
    >;
  const mockGetDependencyRootsFromProjectNames =
    getDependencyRootsFromProjectNames as jest.MockedFunction<
      typeof getDependencyRootsFromProjectNames
    >;
  const mockGetCommits = getCommits as jest.MockedFunction<typeof getCommits>;
  const mockGetFirstCommitRef = getFirstCommitRef as jest.MockedFunction<
    typeof getFirstCommitRef
  >;
  const mockGitSemverTags: jest.Mock = gitSemverTags;

  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetLastVersion.mockReturnValue(of('2.1.0'));
    mockGetProjectDependencies.mockResolvedValue([]);
    mockGetDependencyRootsFromProjectNames.mockImplementation(
      (_, workspace) => {
        const projectRoot = workspace?.projects.dep2?.root;
        return projectRoot ? [{ name: 'dep2', path: projectRoot }] : [];
      },
    );
    loggerSpy = jest.spyOn(logger, 'warn');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should compute next version based on last version and changes', async () => {
    mockGetCommits.mockReturnValue(of(['feat: A', 'feat: B']));
    /* Mock bump to return "minor". */
    mockConventionalRecommendedBump.mockImplementation(
      jest.fn().mockResolvedValue({
        releaseType: 'minor',
      }),
    );

    const newVersion = await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        releaseType: undefined,
        preid: undefined,
        skipCommitTypes: [],

        projectName: '',
      }),
    );

    expect(newVersion?.version).toEqual('2.2.0');
    expect(newVersion?.previousVersion).toEqual('2.1.0');
    expect(mockGetCommits).toHaveBeenCalledTimes(1);
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.1.0',
    });

    expect(mockConventionalRecommendedBump).toHaveBeenCalledTimes(1);
    expect(mockConventionalRecommendedBump).toHaveBeenCalledWith(
      {
        path: '/libs/demo',
        preset: 'conventionalcommits',
        tagPrefix: 'v',
      },
      undefined,
    );
  });

  it('should compute the next version based on last version, changes, and dependencies', async () => {
    mockGetCommits
      .mockReturnValueOnce(of(['chore: A', 'chore: B']))
      .mockReturnValueOnce(of(['chore: A', 'chore: B']))
      .mockReturnValueOnce(of(['fix: A', 'feat: B']));

    /* Mock bump to return "minor". */
    mockConventionalRecommendedBump.mockImplementation(
      jest
        .fn()
        .mockResolvedValueOnce({
          releaseType: undefined,
        })
        .mockResolvedValueOnce({
          releaseType: undefined,
        })
        .mockResolvedValueOnce({
          releaseType: 'minor',
        }),
    );

    const newVersion = await lastValueFrom(
      tryBump({
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        dependencyRoots: [
          { name: 'dep1', path: '/libs/dep1' },
          { name: 'dep2', path: '/libs/dep2' },
        ],
        tagPrefix: 'v',
        syncVersions: true,
        skipCommitTypes: [],

        projectName: '',
      }),
    );

    expect(newVersion?.version).toEqual('2.1.1');

    expect(mockGetCommits).toHaveBeenCalledTimes(3);
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/demo',

      since: 'v2.1.0',
    });
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/dep1',
      since: 'v2.1.0',
    });
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/dep2',
      since: 'v2.1.0',
    });

    expect(mockConventionalRecommendedBump).toHaveBeenCalledTimes(1);
    expect(mockConventionalRecommendedBump).toHaveBeenCalledWith(
      {
        path: '/libs/demo',
        preset: 'conventionalcommits',
        tagPrefix: 'v',
      },
      undefined,
    );
  });

  it('should bump when a dependency would bump through its own dependencies', async () => {
    mockGetLastVersion
      .mockReturnValueOnce(of('2.1.0'))
      .mockReturnValueOnce(of('2.1.0'))
      .mockReturnValueOnce(of('2.1.0'))
      .mockReturnValueOnce(of('2.0.0'));
    mockGetProjectDependencies.mockResolvedValueOnce(['dep2']);
    mockGetCommits
      .mockReturnValueOnce(of([]))
      .mockReturnValueOnce(of(['docs: dependency snapshot release']))
      .mockReturnValueOnce(of(['docs: dependency snapshot release']))
      .mockReturnValueOnce(of(['feat: transitive dependency change']));
    mockConventionalRecommendedBump.mockImplementation(
      jest
        .fn()
        .mockResolvedValueOnce({
          releaseType: undefined,
        })
        .mockResolvedValueOnce({
          releaseType: undefined,
        }),
    );

    const newVersion = await lastValueFrom(
      tryBump({
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        dependencyRoots: [{ name: 'dep1', path: '/libs/dep1' }],
        tagPrefix: 'v',
        skipCommitTypes: ['docs'],
        syncVersions: true,
        projectName: '',
        workspace: {
          version: 1,
          projects: {
            dep2: {
              root: '/libs/dep2',
            },
          },
        },
      }),
    );

    expect(newVersion).toEqual({
      dependencyUpdates: [
        {
          dependencyName: 'dep1',
          type: 'dependency',
          version: '2.1.1',
        },
      ],
      previousVersion: '2.1.0',
      version: '2.1.1',
    });
    expect(mockGetProjectDependencies).toHaveBeenCalledWith('dep1');
  });

  it('should use given type to calculate next version', async () => {
    mockGetCommits.mockReturnValue(of(['feat: A', 'feat: B']));

    const newVersion = await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        releaseType: 'premajor',
        skipCommitTypes: [],
        preid: 'alpha',

        projectName: '',
      }),
    );

    expect(newVersion?.version).toEqual('3.0.0-alpha.0');

    expect(mockConventionalRecommendedBump).not.toHaveBeenCalled();

    expect(mockGetCommits).toHaveBeenCalledTimes(1);
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.1.0',
    });
  });

  it('should use prerelease to calculate next major release version', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-3.0.0-beta.0',
      'my-lib-2.1.0',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);
    mockGetCommits.mockReturnValue(of(['feat: A', 'feat: B']));

    const newVersion = await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        releaseType: 'major',
        skipCommitTypes: [],
        projectName: '',
      }),
    );

    expect(newVersion).toEqual({
      version: '3.0.0',
      previousVersion: '2.1.0',
      dependencyUpdates: [],
    });
    expect(mockConventionalRecommendedBump).not.toHaveBeenCalled();
    expect(mockGetCommits).toHaveBeenCalledTimes(1);
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.1.0',
    });
  });

  it('should use prerelease to calculate next patch release version', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.1.1-beta.0',
      'my-lib-2.1.0',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);
    mockGetCommits.mockReturnValue(of(['feat: A', 'feat: B']));

    const newVersion = await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        releaseType: 'patch',
        projectName: '',
        skipCommitTypes: [],
      }),
    );

    expect(newVersion).toEqual({
      version: '2.1.1',
      previousVersion: '2.1.0',
      dependencyUpdates: [],
    });
    expect(mockConventionalRecommendedBump).not.toHaveBeenCalled();
    expect(mockGetCommits).toHaveBeenCalledTimes(1);
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.1.0',
    });
  });

  it('should use prerelease to calculate next minor release version', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.2.0-beta.0',
      'my-lib-2.1.0',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);
    mockGetCommits.mockReturnValue(of(['feat: A', 'feat: B']));

    const newVersion = await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        releaseType: 'minor',
        projectName: '',
        skipCommitTypes: [],
      }),
    );

    expect(newVersion).toEqual({
      version: '2.2.0',
      previousVersion: '2.1.0',
      dependencyUpdates: [],
    });
    expect(mockConventionalRecommendedBump).not.toHaveBeenCalled();
    expect(mockGetCommits).toHaveBeenCalledTimes(1);
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.1.0',
    });
  });

  it('should use given type to calculate next version even if there are no changes', async () => {
    mockGetCommits.mockReturnValue(of([]));

    const newVersion = await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        releaseType: 'patch',
        projectName: '',

        skipCommitTypes: [],
      }),
    );

    expect(newVersion?.version).toEqual('2.1.1');
    expect(newVersion?.previousVersion).toEqual('2.1.0');
    expect(mockConventionalRecommendedBump).not.toHaveBeenCalled();
  });

  it('should graduate prerelease to release using conventional commits', async () => {
    // Mock getLastVersion to return the highest version (including prerelease)
    mockGetLastVersion.mockReturnValueOnce(of('2.0.0-rc.1'));

    mockGetCommits.mockReturnValue(of(['fix: bug fix']));
    mockConventionalRecommendedBump.mockImplementation(
      jest.fn().mockResolvedValue({
        releaseType: 'patch',
      }),
    );

    const newVersion = await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'angular',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        projectName: '',
        skipCommitTypes: [],
      }),
    );

    expect(newVersion).toEqual({
      version: '2.0.0',
      previousVersion: '2.0.0-rc.1',
      dependencyUpdates: [],
    });
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.0.0-rc.1',
    });
  });

  it('should handle multiple prerelease versions with different preids', async () => {
    // Mock getLastVersion to return the highest prerelease version (beta.2 > alpha.5)
    mockGetLastVersion.mockReturnValueOnce(of('3.0.0-beta.2'));

    mockGetCommits.mockReturnValue(of(['feat: new feature']));
    mockConventionalRecommendedBump.mockImplementation(
      jest.fn().mockResolvedValue({
        releaseType: 'minor',
      }),
    );

    const newVersion = await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'angular',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        projectName: '',
        skipCommitTypes: [],
      }),
    );

    expect(newVersion).toEqual({
      version: '3.0.0',
      previousVersion: '3.0.0-beta.2',
      dependencyUpdates: [],
    });
  });

  it('should call getFirstCommitRef if version is 0.0.0', async () => {
    mockGetLastVersion.mockReturnValue(throwError(() => 'No version found'));
    mockGetCommits.mockReturnValue(of([]));
    mockGetFirstCommitRef.mockReturnValue(of('sha1'));
    mockConventionalRecommendedBump.mockImplementation(
      jest.fn().mockResolvedValue({
        releaseType: undefined,
      }),
    );

    await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        projectName: '',

        skipCommitTypes: [],
      }),
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('No previous version tag found'),
    );
    expect(mockGetCommits).toHaveBeenCalledTimes(1);
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/demo',
      since: 'sha1',
    });
  });

  it('should return undefined if there are no changes in current path', async () => {
    mockGetCommits.mockReturnValue(of([]));
    mockConventionalRecommendedBump.mockImplementation(
      jest.fn().mockResolvedValue({
        releaseType: 'patch',
      }),
    );

    const newVersion = await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        projectName: '',

        skipCommitTypes: [],
      }),
    );

    expect(newVersion).toBeNull();
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.1.0',
    });
  });

  it('should try to do a bump even if there are no changes in current path when allowEmptyRelease is true', async () => {
    mockGetCommits.mockReturnValue(of([]));
    mockConventionalRecommendedBump.mockImplementation(
      jest.fn().mockResolvedValue({
        releaseType: 'patch',
      }),
    );

    const newVersion = await lastValueFrom(
      tryBump({
        syncVersions: false,
        preset: 'conventionalcommits',
        projectRoot: '/libs/demo',
        tagPrefix: 'v',
        allowEmptyRelease: true,
        projectName: '',

        skipCommitTypes: [],
      }),
    );

    expect(newVersion?.version).toEqual('2.1.1');
    expect(mockGetCommits).toHaveBeenCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.1.0',
    });
  });

  describe('skipCommitTypes is set', () => {
    it('should return undefined if all commits types match skipCommitTypes', async () => {
      mockGetCommits.mockReturnValue(of(['docs: A ', 'refactor: B ']));
      mockConventionalRecommendedBump.mockImplementation(
        jest.fn().mockResolvedValue({
          releaseType: 'patch',
        }),
      );

      const newVersion = await lastValueFrom(
        tryBump({
          syncVersions: false,
          preset: 'conventionalcommits',
          skipCommitTypes: ['docs', 'refactor'],
          projectRoot: '/libs/demo',
          tagPrefix: 'v',

          projectName: '',
        }),
      );

      expect(newVersion).toBeNull();
    });
    it('should return correct version if NOT commits types match skipCommitTypes', async () => {
      mockGetCommits.mockReturnValue(of(['feat: A', 'docs: B']));
      mockConventionalRecommendedBump.mockImplementation(
        jest.fn().mockResolvedValue({
          releaseType: 'patch',
        }),
      );

      const newVersion = await lastValueFrom(
        tryBump({
          syncVersions: false,
          preset: 'conventionalcommits',
          skipCommitTypes: ['docs', 'refactor'],
          projectRoot: '/libs/demo',
          tagPrefix: 'v',

          projectName: '',
        }),
      );

      expect(newVersion?.version).toEqual('2.1.1');
    });

    it('should return undefined if all dependency commits types match skipCommitTypes', async () => {
      mockGetCommits
        .mockReturnValueOnce(of([]))
        .mockReturnValueOnce(of(['docs: A', 'refactor(scope): B']));

      mockConventionalRecommendedBump.mockImplementation(
        jest
          .fn()
          .mockResolvedValueOnce({
            releaseType: undefined,
          })
          .mockResolvedValueOnce({
            releaseType: undefined,
          }),
      );

      const newVersion = await lastValueFrom(
        tryBump({
          preset: 'conventionalcommits',
          projectRoot: '/libs/demo',
          dependencyRoots: [{ name: 'dep1', path: '/libs/dep1' }],
          tagPrefix: 'v',
          skipCommitTypes: ['docs', 'refactor'],

          syncVersions: true,
          projectName: '',
        }),
      );

      expect(newVersion).toBeNull();
    });
  });

  describe('custom parser config', () => {
    it('can deal with a custom commitParserOptions (no changes)', async () => {
      mockGetCommits.mockReturnValue(
        of(['JIRA-1234 chore: A', 'JIRA-5678 chore B']),
      );
      /* Mock bump to return "minor". */
      mockConventionalRecommendedBump.mockImplementation(
        jest.fn().mockResolvedValue({
          releaseType: 'minor',
        }),
      );

      const newVersion = await lastValueFrom(
        tryBump({
          syncVersions: false,
          preset: 'conventionalcommits',
          projectRoot: '/libs/demo',
          tagPrefix: 'v',
          releaseType: undefined,
          preid: undefined,
          skipCommitTypes: ['chore'],

          projectName: '',
          commitParserOptions: {
            headerPattern:
              /^([A-Z]{3,}-\d{1,5}):? (chore|build|ci|docs|feat|fix|perf|refactor|test)(?:\(([\w-]+)\))?\S* (.+)$/,
            headerCorrespondence: [
              'ticketReference',
              'type',
              'scope',
              'subject',
            ],
          },
        }),
      );

      expect(newVersion).toBeNull();
    });

    it('can deal with a custom commitParserOptions (with changes)', async () => {
      mockGetCommits.mockReturnValue(
        of(['JIRA-1234 feat: A', 'JIRA-5678 fix(scope) B']),
      );
      /* Mock bump to return "minor". */
      mockConventionalRecommendedBump.mockImplementation(
        jest.fn().mockResolvedValue({
          releaseType: 'minor',
        }),
      );

      const newVersion = await lastValueFrom(
        tryBump({
          commitParserOptions: {
            headerPattern:
              /^([A-Z]{3,}-\d{1,5}):? (chore|build|ci|docs|feat|fix|perf|refactor|test)(?:\(([\w-]+)\))?\S* (.+)$/,
            headerCorrespondence: [
              'ticketReference',
              'type',
              'scope',
              'subject',
            ],
          },
          preid: undefined,
          preset: 'conventionalcommits',
          projectName: '',
          projectRoot: '/libs/demo',
          releaseType: undefined,
          skipCommitTypes: ['chore'],
          syncVersions: false,
          tagPrefix: 'v',
        }),
      );

      expect(newVersion).toStrictEqual({
        dependencyUpdates: [],
        previousVersion: '2.1.0',
        version: '2.2.0',
      });
    });
  });
});
