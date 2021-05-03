import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import * as semver from 'semver';
import { promisify } from 'util';

import { Logger } from '../version';
import { getLastVersion } from './get-last-version';
import { getCommits, getFirstCommitRef } from './git';

/**
 * Return new version or null if nothing changed.
 * @internal
 */
export async function tryBump({
  preset,
  projectRoot,
  tagPrefix,
  logger,
  releaseType = null,
  preid = null,
}: {
  preset: string;
  projectRoot: string;
  tagPrefix: string;
  releaseType: string | null;
  preid: string | null;
  logger: Logger;
}): Promise<string> {
  const initialVersion = '0.0.0';
  let lastVersion: string | undefined;

  try {
    lastVersion = await getLastVersion({ tagPrefix });
  } catch (error) {
    logger.warn(
      `🟠 No previous version tag found, fallback to version 0.0.0.
New version will be calculated based on all changes since first commit.
If your project is already versioned, please tag the latest release commit with ${tagPrefix}x.y.z and run this command again.`
    );

    lastVersion = initialVersion;
  }

  /** If lastVersion equals 0.0.0 it means no tag exist,
   * then get the first commit ref to compute the initial version. */
  const lastVersionGitRef =
    lastVersion === initialVersion
      ? await getFirstCommitRef()
      : `${tagPrefix}${lastVersion}`;

  const commits = await getCommits({
    projectRoot,
    since: lastVersionGitRef,
  }).toPromise();

  /* If release type is manually specified,
   * we just release even if there are no changes. */
  if (releaseType !== null) {
    return manualBump({ since: lastVersion, releaseType, preid });
  }

  /* No commits since last release so don't bump. */
  if (commits.length === 0) {
    return null;
  }

  return semverBump({
    since: lastVersion,
    preset,
    projectRoot,
    tagPrefix,
  });
}

/**
 * @internal
 */
export async function semverBump({
  since,
  preset,
  projectRoot,
  tagPrefix,
}: {
  since: string;
  preset: string;
  projectRoot: string;
  tagPrefix: string;
}): Promise<string> {
  const getSemverVersion = promisify(conventionalRecommendedBump);
  const recommended = await getSemverVersion({
    path: projectRoot,
    preset,
    tagPrefix,
  });
  const { releaseType } = recommended;
  return semver.inc(since, releaseType);
}

/**
 * @internal
 */
export async function manualBump({
  since,
  releaseType,
  preid,
}: {
  since: string;
  releaseType: string;
  preid: string;
}): Promise<string> {
  const hasPreid =
    ['premajor', 'preminor', 'prepatch', 'prerelease'].includes(releaseType) &&
    preid !== null;

  const semverArgs: string[] = [
    since,
    releaseType,
    ...(hasPreid ? [preid] : []),
  ];

  return semver.inc(...semverArgs);
}
