import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import { defer, forkJoin, iif, Observable, of } from 'rxjs';
import { catchError, shareReplay, switchMap } from 'rxjs/operators';
import * as semver from 'semver';
import { logger as devkitLogger } from '@nrwl/devkit';

import { promisify } from 'util';

import { getLastVersion } from './get-last-version';
import { getCommits, getFirstCommitRef } from './git';
import { logger } from '@nrwl/devkit';

/**
 * Return new version or null if nothing changed.
 */
export function tryBump({
  preset,
  projectRoot,
  tagPrefix,
  releaseType = null,
  preid = null,
}: {
  preset: string;
  projectRoot: string;
  tagPrefix: string;
  releaseType: string | null;
  preid: string | null;
}): Observable<string> {
  const initialVersion = '0.0.0';
  const lastVersion$ = getLastVersion({ tagPrefix }).pipe(
    catchError(() => {
      logger.warn(
        `🟠 No previous version tag found, fallback to version 0.0.0.
New version will be calculated based on all changes since first commit.
If your project is already versioned, please tag the latest release commit with ${tagPrefix}x.y.z and run this command again.`
      );
      return of(initialVersion);
    }),
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  );

  const lastVersionGitRef$ = lastVersion$.pipe(
    /** If lastVersion equals 0.0.0 it means no tag exist,
     * then get the first commit ref to compute the initial version. */
    switchMap((lastVersion) =>
      iif(
        () => lastVersion === initialVersion,
        getFirstCommitRef(),
        of(`${tagPrefix}${lastVersion}`)
      )
    )
  );

  const commits$ = lastVersionGitRef$.pipe(
    switchMap((lastVersionGitRef) =>
      getCommits({
        projectRoot,
        since: lastVersionGitRef,
      })
    )
  );

  return forkJoin([lastVersion$, commits$]).pipe(
    switchMap(([lastVersion, commits]) => {
      /* If release type is manually specified,
       * we just release even if there are no changes. */
      if (releaseType !== null) {
        return _manualBump({ since: lastVersion, releaseType, preid });
      }

      /* No commits since last release so don't bump. */
      if (commits.length === 0) {
        return of(null);
      }

      return _semverBump({
        since: lastVersion,
        preset,
        projectRoot,
        tagPrefix,
      });
    })
  );
}

export function _semverBump({
  since,
  preset,
  projectRoot,
  tagPrefix,
}: {
  since: string;
  preset: string;
  projectRoot: string;
  tagPrefix: string;
}): Observable<string> {
  return defer(async () => {
    const recommended = await promisify(conventionalRecommendedBump)({
      path: projectRoot,
      preset,
      tagPrefix,
    });
    const { releaseType } = recommended;
    return semver.inc(since, releaseType);
  });
}

export function _manualBump({
  since,
  releaseType,
  preid,
}: {
  since: string;
  releaseType: string;
  preid: string;
}): Observable<string> {
  return defer(() => {
    const hasPreid =
      ['premajor', 'preminor', 'prepatch', 'prerelease'].includes(
        releaseType
      ) && preid !== null;

    const semverArgs: string[] = [
      since,
      releaseType,
      ...(hasPreid ? [preid] : []),
    ];

    return of<string>(semver.inc(...semverArgs));
  });
}
