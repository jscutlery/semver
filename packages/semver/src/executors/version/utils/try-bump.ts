import { logger } from '@nrwl/devkit';
import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import { defer, forkJoin, iif, of } from 'rxjs';
import { catchError, defaultIfEmpty, filter, map, shareReplay, switchMap } from 'rxjs/operators';
import * as semver from 'semver';
import { promisify } from 'util';

import { getLastVersion } from './get-last-version';
import { getCommits, getFirstCommitRef } from './git';
import { formatTag, resolveTagPrefix } from './tag';

import type { Observable } from 'rxjs';
import type { ReleaseIdentifier } from '../schema';
import type { DependencyRoot } from './get-project-dependencies';
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

export interface NewVersion {
  version: string;
  dependencyUpdates: Version[];
}

const initialVersion = '0.0.0';

export function getProjectVersion({
  tagPrefix,
  projectRoot,
  releaseType,
  since,
}: {
  tagPrefix: string;
  projectRoot: string;
  releaseType?: ReleaseIdentifier;
  since?: string;
}) {
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
        () => _isInitialVersion({ lastVersion }),
        getFirstCommitRef(),
        of(formatTag({ tagPrefix, lastVersion }))
      )
    )
  );

  const commits$ = lastVersionGitRef$.pipe(
    switchMap((lastVersionGitRef) => {
      return getCommits({
        projectRoot,
        since: since ?? lastVersionGitRef,
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
}): Observable<NewVersion | null> {
  const { lastVersion$, commits$, lastVersionGitRef$ } = getProjectVersion({
    tagPrefix,
    projectRoot,
    releaseType,
  });

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
          map((version) => ({ version, dependencyUpdates: [] } as NewVersion))
        );
      }

      const dependencyVersions$ = _getDependencyVersions({
        lastVersion,
        lastVersionGitRef,
        dependencyRoots,
        preset,
        releaseType,
        versionTagPrefix,
        syncVersions,
      });

      const projectBump$ = _semverBump({
        since: lastVersion,
        preset,
        projectRoot,
        tagPrefix,
      }).pipe(map((version) => ({ type: 'project', version })));

      return forkJoin([projectBump$, dependencyVersions$]).pipe(
        switchMap(([projectVersion, dependencyVersions]) => {
          const dependencyUpdates = dependencyVersions.filter(_isNewVersion);
          const newVersion: NewVersion = {
            version: projectVersion.version || lastVersion,
            dependencyUpdates,
          };

          /* bump patch version if dependency updates are available */
          if (projectVersion.version === null && dependencyUpdates.length) {
            return _manualBump({
              since: lastVersion,
              releaseType: 'patch',
              preid: preid as string,
            }).pipe(
              map((version) =>
                ({
                  ...newVersion,
                  version: version || lastVersion,
                } as NewVersion)
              )
            );
          }

          /* No commits since last release & no dependency updates so don't bump. */
          if (!dependencyUpdates.length && !commits.length) {
            return of(null);
          }

          return of(newVersion);
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

export function _getDependencyVersions({
  preset,
  dependencyRoots,
  releaseType,
  versionTagPrefix,
  syncVersions,
  lastVersion,
  lastVersionGitRef,
}: {
  preset: string;
  lastVersion: string;
  lastVersionGitRef: string;
  dependencyRoots: DependencyRoot[];
  releaseType?: ReleaseIdentifier;
  versionTagPrefix?: string | null;
  syncVersions?: boolean;
}): Observable<Version[]> {
  return forkJoin(
    dependencyRoots.map(({ path: projectRoot, name: projectName }) => {
      /* Get dependency version changes since last project version */
      const tagPrefix = resolveTagPrefix({
        versionTagPrefix,
        projectName,
        syncVersions: !!syncVersions,
      });

      /* If project version is 0.0.0, check dependency changes since first commit */
      const since = _isInitialVersion({ lastVersion })
        ? lastVersionGitRef
        : formatTag({ tagPrefix, lastVersion });

      const { lastVersion$, commits$ } = getProjectVersion({
        tagPrefix,
        projectRoot,
        releaseType,
        since,
      });

      return forkJoin([lastVersion$, commits$]).pipe(
        filter(([, commits]) => commits.length > 0),
        switchMap(([dependencyLastVersion]) => {
          /* Dependency has changes but has no tagged version */
          if (_isInitialVersion({ lastVersion: dependencyLastVersion })) {
            return _semverBump({
              since: dependencyLastVersion,
              preset,
              projectRoot,
              tagPrefix,
            }).pipe(
              map(
                (version) =>
                  ({
                    type: 'dependency',
                    version,
                    dependencyName: projectName,
                  } as Version)
              )
            );
          }

          /* Return the changed version of dependency since last commit within project */
          return of({
            type: 'dependency',
            version: dependencyLastVersion,
            dependencyName: projectName,
          } as Version);
        })
      );
    })
  ).pipe(defaultIfEmpty([]));
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
