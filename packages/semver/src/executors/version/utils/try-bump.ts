import { logger } from '@nrwl/devkit';
import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import { defer, forkJoin, iif, of } from 'rxjs';
import {
  catchError,
  defaultIfEmpty,
  shareReplay,
  switchMap,
} from 'rxjs/operators';
import * as semver from 'semver';
import { promisify } from 'util';

import { getLastVersion } from './get-last-version';
import { getCommits, getFirstCommitRef } from './git';

import type { Observable } from 'rxjs';
import type { ReleaseIdentifier } from '../schema';
import { DependencyRoot } from './get-project-dependencies';
import { resolveTagPrefix } from './resolve-tag-prefix';

export type Version =
  | {
      type: 'project';
      version: string | null;
    }
  | {
      type: 'dependency';
      version: string | null;
      dependencyName: string;
    };

export type TryBumpReturn = {
  version: string;
  dependencyUpdates: Version[];
};

const initialVersion = '0.0.0';

export function getProjectVersion(
  tagPrefix: string,
  projectPath: string,
  releaseType?: ReleaseIdentifier,
  since?: string
) {
  const lastVersion$ = getLastVersion({
    tagPrefix,
    includePrerelease: releaseType === 'prerelease',
  }).pipe(
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
      return getCommits({
        projectRoot: projectPath,
        since: since || lastVersionGitRef,
      });
    })
  );

  return {
    lastVersion$,
    commits$,
    lastVersionGitRef$,
  };
}

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
  versionTagPrefix,
  syncVersions,
}: {
  preset: string;
  projectRoot: string;
  tagPrefix: string;
  dependencyRoots?: DependencyRoot[];
  releaseType?: ReleaseIdentifier;
  preid?: string;
  versionTagPrefix?: string | null;
  syncVersions?: boolean;
}): Observable<TryBumpReturn | null> {
  const { lastVersion$, commits$, lastVersionGitRef$ } = getProjectVersion(
    tagPrefix,
    projectRoot,
    releaseType
  );

  return forkJoin([lastVersion$, commits$, lastVersionGitRef$]).pipe(
    switchMap(([lastVersion, commits, lastVersionGitRef]) => {
      /* If release type is manually specified,
       * we just release even if there are no changes. */
      if (releaseType !== undefined) {
        return _manualBump({
          since: lastVersion,
          releaseType: releaseType as string,
          preid: preid as string,
        }).pipe(
          switchMap((version) =>
            of({ version, dependencyUpdates: [] } as TryBumpReturn)
          )
        );
      }

      const dependencyChecks$ = forkJoin(
        dependencyRoots.map((root) => {
          const depTagPrefix = resolveTagPrefix({
            versionTagPrefix,
            projectName: root.name,
            syncVersions: !!syncVersions,
          });

          /* Get dependency version changes since last project version */
          const { lastVersion$: depLastVersion$, commits$: depCommits$ } =
            getProjectVersion(
              depTagPrefix,
              root.path,
              releaseType,
              /* If project version is 0.0.0, check dependency changes since first commit */
              lastVersion === initialVersion
                ? lastVersionGitRef
                : `${tagPrefix}${lastVersion}`
            );

          return forkJoin([depLastVersion$, depCommits$]).pipe(
            switchMap(([depLastVersion, depCommits]) => {
              /* No commits since last release so don't bump. */
              if (depCommits.length === 0) return of(null);

              /* Dependency has changes but has no tagged version */
              if (depCommits.length && depLastVersion === initialVersion) {
                return _semverBump({
                  since: lastVersion,
                  preset,
                  projectRoot: root.path,
                  tagPrefix,
                }).pipe(
                  switchMap((version) =>
                    of({
                      type: 'dependency',
                      version,
                      dependencyName: root.name,
                    } as Version)
                  )
                );
              }

              /* Return the changed version of dependency since last commit within project */
              return of({
                type: 'dependency',
                version: depLastVersion,
                dependencyName: root.name,
              } as Version);
            })
          );
        })
      ).pipe(defaultIfEmpty([]));

      const projectBump$ = _semverBump({
        since: lastVersion,
        preset,
        projectRoot,
        tagPrefix,
      }).pipe(
        switchMap((version) => of({ type: 'project', version } as Version))
      );

      const rtn = forkJoin([projectBump$, dependencyChecks$]).pipe(
        switchMap(([projectBump, dependencyChecks]) => {
          const dependencyUpdates = dependencyChecks.filter(
            (v) =>
              v !== null &&
              v.type === 'dependency' &&
              v.version !== null &&
              v.version !== initialVersion
          ) as Version[];

          const rtn: TryBumpReturn = {
            version: projectBump.version || lastVersion,
            dependencyUpdates,
          };

          /* bump patch version if dependency updates are available */
          if (projectBump.version === null && dependencyUpdates.length) {
            return _manualBump({
              since: lastVersion,
              releaseType: 'patch',
              preid: preid as string,
            }).pipe(
              switchMap((version) =>
                of({
                  ...rtn,
                  version: version || lastVersion,
                } as TryBumpReturn)
              )
            );
          }

          /* No commits since last release & no dependency updates so don't bump. */
          if (!dependencyUpdates.length && !commits.length) {
            return of(null);
          }

          return of(rtn);
        })
      );

      return rtn;
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
}) {
  return defer(async () => {
    const recommended = (await promisify(conventionalRecommendedBump)({
      path: projectRoot,
      preset,
      tagPrefix,
    })) as { releaseType: semver.ReleaseType };
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
}) {
  return defer(() => {
    const hasPreid =
      ['premajor', 'preminor', 'prepatch', 'prerelease'].includes(
        releaseType
      ) && preid !== null;

    const semverArgs: [string, semver.ReleaseType, ...string[]] = [
      since,
      releaseType as semver.ReleaseType,
      ...(hasPreid ? [preid] : []),
    ];

    return of(semver.inc(...semverArgs));
  });
}
