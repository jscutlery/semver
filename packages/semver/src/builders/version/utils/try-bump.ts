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
  preset = 'angular',
  projectRoot,
  tagPrefix,
}: {
  preset?: string;
  projectRoot: string;
  tagPrefix: string;
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
        const { releaseType } = await promisify(conventionalRecommendedBump)({
          path: projectRoot,
          preset,
          tagPrefix,
        });

        /* Compute new version depending on release type. */
        return semver.inc(version, releaseType);
      });
    })
  );
}
