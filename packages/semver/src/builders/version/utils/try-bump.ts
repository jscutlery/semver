import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import * as semver from 'semver';
import { defer, forkJoin, Observable, of } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { promisify } from 'util';
import { getCurrentVersion } from './get-current-version';
import { getCommits } from './git';

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
  const version$ = getCurrentVersion({
    projectRoot,
    tagPrefix,
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  );

  const commits$ = version$.pipe(
    switchMap((version) =>
      getCommits({
        projectRoot,
        since: version !== '0.0.0' ? `${tagPrefix}${version}` : null,
      })
    )
  );

  return forkJoin([version$, commits$]).pipe(
    switchMap(([version, commits]) => {
      /* No commits since last release so don't bump. */
      if (commits.length === 0) {
        return of(null);
      }

      /* Compute new version. */
      return defer(async () => {
        /* Compute release type depending on commits. */
        if (releaseType == null) {
          const recommended = await promisify(conventionalRecommendedBump)({
            path: projectRoot,
            preset,
            tagPrefix,
          });

          releaseType = recommended.releaseType;
        }

        /* Compute new version depending on release type. */
        if (
          ['premajor', 'preminor', 'prepatch', 'prerelease'].includes(
            releaseType
          ) &&
          preid
        ) {
          return semver.inc(version, releaseType, preid);
        } else {
          return semver.inc(version, releaseType);
        }
      });
    })
  );
}
