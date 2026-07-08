import {
  sync as parseConventionalCommitsSync,
  Options as CommitParserOptions,
} from 'conventional-commits-parser';
import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import * as semver from 'semver';
import type { ProjectsConfigurations } from '@nx/devkit';
import type { PresetOpt, ReleaseIdentifier } from '../schema';
import { type Version } from '../version';
import { getLastVersion } from './get-last-version';
import {
  getDependencyRootsFromProjectNames,
  getProjectDependencies,
  type DependencyRoot,
} from './get-project-dependencies';
import { getCommits, getFirstCommitRef } from './git';
import { logStep } from './logger';
import { formatTag, formatTagPrefix } from './tag';

export interface NewVersion {
  version: string;
  previousVersion: string;
  dependencyUpdates: Version[];
}

const initialVersion = '0.0.0';

export async function getProjectVersion({
  tagPrefix,
  projectRoot,
  releaseType,
  since,
  projectName,
  preid,
}: {
  tagPrefix: string;
  projectRoot: string;
  releaseType?: ReleaseIdentifier;
  since?: string;
  projectName: string;
  preid?: string;
}): Promise<{
  lastVersion: string;
  commits: string[];
  lastVersionGitRef: string;
}> {
  let lastVersion: string;
  try {
    lastVersion = await getLastVersion({
      tagPrefix,
      preid,
      releaseType,
    });
  } catch {
    logStep({
      step: 'warning',
      level: 'warn',
      message: `No previous version tag found, fallback to version 0.0.0.
        New version will be calculated based on all changes since first commit.
        If your project is already versioned, please tag the latest release commit with ${tagPrefix}x.y.z and run this command again.`,
      projectName,
    });
    lastVersion = initialVersion;
  }

  /** If lastVersion equals 0.0.0 it means no tag exist,
   * then get the first commit ref to compute the initial version. */
  const lastVersionGitRef = _isInitialVersion({ lastVersion })
    ? await getFirstCommitRef()
    : formatTag({ tagPrefix, version: lastVersion });

  const commits = await getCommits({
    projectRoot,
    since: since ?? lastVersionGitRef,
  });

  return { lastVersion, commits, lastVersionGitRef };
}

/**
 * Return new version or null if nothing changed.
 */
export async function tryBump({
  commitParserOptions,
  preset,
  projectRoot,
  tagPrefix,
  dependencyRoots = [],
  releaseType,
  preid,
  versionTagPrefix,
  syncVersions,
  allowEmptyRelease,
  skipCommitTypes,
  projectName,
  workspace,
  visitedProjects = [],
}: {
  commitParserOptions?: CommitParserOptions;
  preset: PresetOpt;
  projectRoot: string;
  tagPrefix: string;
  dependencyRoots?: DependencyRoot[];
  releaseType?: ReleaseIdentifier;
  preid?: string;
  versionTagPrefix?: string | null;
  syncVersions: boolean;
  allowEmptyRelease?: boolean;
  skipCommitTypes: string[];
  projectName: string;
  workspace?: ProjectsConfigurations;
  visitedProjects?: string[];
}): Promise<NewVersion | null> {
  const { lastVersion, commits, lastVersionGitRef } = await getProjectVersion({
    tagPrefix,
    projectRoot,
    releaseType,
    projectName,
    preid,
  });

  if (releaseType && releaseType !== 'prerelease') {
    const version = await _manualBump({
      since: lastVersion,
      releaseType,
      preid,
    });

    return version
      ? {
          version,
          previousVersion: lastVersion,
          dependencyUpdates: [],
        }
      : null;
  }

  const [projectVersion, dependencyVersions] = await Promise.all([
    _semverBump({
      since: lastVersion,
      preset,
      projectRoot,
      tagPrefix,
      releaseType,
      preid,
      commitParserOptions,
    }).then((version) => ({ type: 'project', version })),
    _getDependencyVersions({
      commitParserOptions,
      lastVersionGitRef,
      dependencyRoots,
      preset,
      releaseType,
      versionTagPrefix,
      skipCommitTypes,
      syncVersions,
      projectName,
      preid,
      workspace,
      visitedProjects: [...visitedProjects, projectName],
    }),
  ]);

  const dependencyUpdates = dependencyVersions.filter(_isNewVersion);
  const newVersion: NewVersion = {
    version: projectVersion.version || lastVersion,
    previousVersion: lastVersion,
    dependencyUpdates,
  };

  /* bump patch version if dependency updates are available */
  if (projectVersion.version === null && dependencyUpdates.length) {
    const version = await _manualBump({
      since: lastVersion,
      releaseType: 'patch',
      preid: preid as string,
    });

    return version
      ? {
          ...newVersion,
          version: version || lastVersion,
          previousVersion: lastVersion,
        }
      : null;
  }

  const filteredCommits = commits.filter((commit: string) =>
    shouldCommitBeCalculated({
      commit,
      commitParserOptions,
      skipCommitTypes,
    }),
  );

  /* No commits since last release & no dependency updates so don't bump if the `releastAtLeast` flag is not present. */
  if (
    !dependencyUpdates.length &&
    !filteredCommits.length &&
    !allowEmptyRelease
  ) {
    return null;
  }

  return newVersion;
}

/* istanbul ignore next */
export async function _semverBump({
  since,
  preset,
  projectRoot,
  tagPrefix,
  releaseType,
  preid,
  commitParserOptions,
}: {
  since: string;
  preset: PresetOpt;
  projectRoot: string;
  tagPrefix: string;
  releaseType?: ReleaseIdentifier;
  preid?: string;
  commitParserOptions?: CommitParserOptions;
}): Promise<string | null> {
  const recommended = await conventionalRecommendedBump(
    {
      path: projectRoot,
      tagPrefix,
      ...(typeof preset === 'string'
        ? { preset }
        : { preset: preset.name ?? 'conventionalcommits', config: preset }),
    },
    commitParserOptions,
  );

  let recommendedReleaseType: ReleaseIdentifier | undefined =
    recommended.releaseType;
  if (recommendedReleaseType && releaseType === 'prerelease') {
    recommendedReleaseType =
      semver.parse(since)?.prerelease.length === 0
        ? `pre${recommendedReleaseType}`
        : releaseType;
  }

  return recommendedReleaseType
    ? semver.inc(since, recommendedReleaseType, preid)
    : null;
}

/* istanbul ignore next */
export async function _manualBump({
  since,
  releaseType,
  preid,
}: {
  since: string;
  releaseType: string;
  preid?: string;
}): Promise<string | null> {
  const semverArgs: [string, ReleaseIdentifier, ...string[]] = [
    since,
    releaseType as ReleaseIdentifier,
    ...(preid ? [preid] : []),
  ];

  return semver.inc(...semverArgs);
}

function shouldCommitBeCalculated({
  commit,
  commitParserOptions,
  skipCommitTypes,
}: {
  commit: string;
  commitParserOptions?: CommitParserOptions;
  skipCommitTypes: string[];
}): boolean {
  const { type } = parseConventionalCommitsSync(
    commit,
    commitParserOptions ?? {},
  );
  const shouldSkip = skipCommitTypes.some((typeToSkip) => typeToSkip === type);
  return !shouldSkip;
}

export async function _getDependencyVersions({
  commitParserOptions,
  preset,
  dependencyRoots,
  releaseType,
  versionTagPrefix,
  syncVersions,
  lastVersionGitRef,
  skipCommitTypes,
  projectName,
  preid,
  workspace,
  visitedProjects,
}: {
  commitParserOptions?: CommitParserOptions;
  preset: PresetOpt;
  lastVersionGitRef: string;
  dependencyRoots: DependencyRoot[];
  releaseType?: ReleaseIdentifier;
  skipCommitTypes: string[];
  versionTagPrefix?: string | null;
  syncVersions: boolean;
  projectName: string;
  preid?: string;
  workspace?: ProjectsConfigurations;
  visitedProjects: string[];
}): Promise<Version[]> {
  if (dependencyRoots.length === 0) {
    return [];
  }

  return Promise.all(
    dependencyRoots.map(
      async ({
        path: projectRoot,
        name: dependencyName,
        options: dependencyOptions,
      }) => {
        const dependencyVersionTagPrefix = dependencyOptions?.tagPrefix;
        /* Get dependency version changes since last project version */
        const tagPrefix = formatTagPrefix({
          versionTagPrefix: dependencyVersionTagPrefix || versionTagPrefix,
          projectName: dependencyName,
          syncVersions,
        });

        const { lastVersion: dependencyLastVersion, commits } =
          await getProjectVersion({
            tagPrefix,
            projectRoot,
            releaseType,
            since: lastVersionGitRef,
            projectName: dependencyName,
            preid,
          });

        const filteredCommits = commits.filter((commit) =>
          shouldCommitBeCalculated({
            commit,
            commitParserOptions,
            skipCommitTypes,
          }),
        );

        if (filteredCommits.length === 0) {
          return getDependencyVersionFromTrackedDependencies({
            dependencyName,
            dependencyLastVersion,
            projectRoot,
            preset,
            tagPrefix,
            releaseType,
            preid,
            versionTagPrefix,
            syncVersions,
            skipCommitTypes,
            commitParserOptions,
            workspace,
            visitedProjects,
          });
        }

        /* Dependency has changes but has no tagged version */
        if (_isInitialVersion({ lastVersion: dependencyLastVersion })) {
          const version = await _semverBump({
            since: dependencyLastVersion,
            preset,
            projectRoot,
            tagPrefix,
            commitParserOptions,
          });

          return {
            type: 'dependency',
            version,
            dependencyName: dependencyName,
          } satisfies Version;
        }

        /* Return the changed version of dependency since last commit within project */
        return {
          type: 'dependency',
          version: dependencyLastVersion,
          dependencyName: dependencyName,
        } satisfies Version;
      },
    ),
  );
}

async function getDependencyVersionFromTrackedDependencies({
  dependencyName,
  dependencyLastVersion,
  projectRoot,
  preset,
  tagPrefix,
  releaseType,
  preid,
  versionTagPrefix,
  syncVersions,
  skipCommitTypes,
  commitParserOptions,
  workspace,
  visitedProjects,
}: {
  dependencyName: string;
  dependencyLastVersion: string;
  projectRoot: string;
  preset: PresetOpt;
  tagPrefix: string;
  releaseType?: ReleaseIdentifier;
  preid?: string;
  versionTagPrefix?: string | null;
  syncVersions: boolean;
  skipCommitTypes: string[];
  commitParserOptions?: CommitParserOptions;
  workspace?: ProjectsConfigurations;
  visitedProjects: string[];
}): Promise<Version> {
  if (workspace == null || visitedProjects.includes(dependencyName)) {
    return {
      type: 'dependency',
      version: null,
      dependencyName,
    } satisfies Version;
  }

  try {
    const dependencyRoots = getDependencyRootsFromProjectNames(
      await getProjectDependencies(dependencyName),
      workspace,
    );

    const newVersion = await tryBump({
      commitParserOptions,
      preset,
      projectRoot,
      tagPrefix,
      dependencyRoots,
      releaseType,
      preid,
      versionTagPrefix,
      syncVersions,
      skipCommitTypes,
      projectName: dependencyName,
      workspace,
      visitedProjects,
    });

    const version =
      newVersion != null && semver.gt(newVersion.version, dependencyLastVersion)
        ? newVersion.version
        : null;

    return {
      type: 'dependency',
      version,
      dependencyName,
    } satisfies Version;
  } catch {
    return {
      type: 'dependency',
      version: null,
      dependencyName,
    } satisfies Version;
  }
}

export function _isNewVersion(version: Version): boolean {
  return version.version !== null && version.version !== initialVersion;
}

export function _isInitialVersion({
  lastVersion,
}: {
  lastVersion: string;
}): boolean {
  return lastVersion === initialVersion;
}
