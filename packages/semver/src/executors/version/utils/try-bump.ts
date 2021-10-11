import { logger } from '@nrwl/devkit';
import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import { defer, forkJoin, iif, of } from 'rxjs';
import { catchError, shareReplay, switchMap } from 'rxjs/operators';
import * as semver from 'semver';
import { promisify } from 'util';
import { gt, inc } from 'semver';

import { getLastVersion } from './get-last-version';
import { getCommits, getFirstCommitRef } from './git';

import type { Observable } from 'rxjs';
import type { ReleaseIdentifier } from '../schema';
/**
 * Return new version or null if nothing changed.
 */
export function tryBump({
  preset,
  projectRoot,
  tagPrefix,
  dependencyRoots = [],
  releaseType,
  preid,
}: {
  preset: string;
  projectRoot: string;
  tagPrefix: string;
  dependencyRoots?: string[];
  releaseType?: ReleaseIdentifier;
  preid?: string;
}) {
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
    switchMap((lastVersionGitRef) => {
      const listOfGetCommits = [projectRoot, ...dependencyRoots].map((root) =>
        getCommits({
          projectRoot: root,
          since: lastVersionGitRef,
        })
      );
      /* Get the lists of commits and its dependencies (if using --track-deps).
       * Note: the mechanism for identifying if --track-deps was used is whether
       * dependencyRoots is a populated array. */
      return combineLatest(listOfGetCommits);
    })
  );

  return forkJoin([lastVersion$, commits$]).pipe(
    switchMap(([lastVersion, commits]) => {
      /* If release type is manually specified,
       * we just release even if there are no changes. */
      if (releaseType !== undefined) {
        return _manualBump({
          since: lastVersion,
          releaseType: releaseType as string,
          preid: preid as string,
        });
      }

      const numOfCommits = commits.reduce((acc, dep) => acc + dep.length, 0);
      /* No commits since last release so don't bump. */
      if (numOfCommits === 0) {
        return of(null);
      }

      const dependencyChecks$ = dependencyRoots.map((root) =>
        _semverBump({
          since: '0.0.0',
          preset,
          projectRoot: root,
          tagPrefix,
        })
      );

      const dependencyBump$ = combineLatest(dependencyChecks$).pipe(
        map((bumps) => {
          // See if there's an increment indicated by a dependency.
          const positiveBumps = bumps
            .filter(b => b !== null && b !== '0.0.0');

          /** If there's an increment, then the target project should
           * receive a patch increment. **/
          if (positiveBumps.length > 0) {
            return inc(lastVersion, 'patch');
          }
          return null;
        })
      );
      return _semverBump({
          since: lastVersion,
          preset,
          projectRoot,
          tagPrefix,
        })
        .pipe(
          switchMap((projectVersionBump) => {
            if (projectVersionBump !== null) {
              return of(projectVersionBump);
            }

            return dependencyBump$;
          })
        );
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
  return defer(async (): Promise<string> => {
    const recommended = (await promisify(conventionalRecommendedBump)({
      path: projectRoot,
      preset,
      tagPrefix,
    })) as { releaseType: semver.ReleaseType };
    const { releaseType } = recommended;
    return semver.inc(since, releaseType) as string;
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
  return defer((): Observable<string> => {
    const hasPreid =
      ['premajor', 'preminor', 'prepatch', 'prerelease'].includes(
        releaseType
      ) && preid !== null;

    const semverArgs: [string, semver.ReleaseType, ...string[]] = [
      since,
      releaseType as semver.ReleaseType,
      ...(hasPreid ? [preid] : []),
    ];

    return of<string>(semver.inc(...semverArgs) as string);
  });
}
