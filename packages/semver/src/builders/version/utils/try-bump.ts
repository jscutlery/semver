import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import { defer, forkJoin, iif, Observable, of } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import * as semver from 'semver';
import { promisify } from 'util';

import { getCurrentVersion } from './get-current-version';
import { getCommits, getFirstCommit } from './git';

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
  const since$ = getCurrentVersion({
    tagPrefix,
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  );

  const sinceGitRef$ = since$.pipe(
    /** 0.0.0 means no tag exist, so get the first commit ref. */
    switchMap((since) =>  iif(() => since === '0.0.0', getFirstCommit(), of(since)))
  );

  const commits$ = sinceGitRef$.pipe(
    switchMap((since) =>
      getCommits({
        projectRoot,
        since,
      })
    )
  );

  return forkJoin([since$, commits$]).pipe(
    switchMap(([since, commits]) => {
      /* No commits since last release so don't bump. */
      if (commits.length === 0) {
        return of(null);
      }

      if (releaseType !== null) {
        return _manualBump({ since, releaseType, preid });
      }

      return _semverBump({ since, preset, projectRoot, tagPrefix });
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
    const newVersion = semver.inc(since, releaseType);
    console.log({ recommended, newVersion });
    return newVersion;
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
  return defer<string>(() => {
    const hasPreid =
      ['premajor', 'preminor', 'prepatch', 'prerelease'].includes(
        releaseType
      ) && preid !== null;

    const semverArgs: string[] = [
      since,
      releaseType,
      ...(hasPreid ? [preid] : []),
    ];

    return semver.inc(...semverArgs);
  });
}
