import { logger } from '@nrwl/devkit';
import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import { combineLatest, defer, forkJoin, iif, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
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

export function getVersionMetadata(tagPrefix: string, rootPaths: string[]) {
  const initialVersion = '0.0.0';
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
      const listOfGetCommits = rootPaths.map((root) =>
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

  return {
    lastVersion$,
    commits$,
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
  const { lastVersion$, commits$ } = getVersionMetadata(tagPrefix, [
    projectRoot,
    ...dependencyRoots.map((d) => d.path),
  ]);

  return forkJoin([lastVersion$, commits$]).pipe(
    switchMap(([lastVersion, commits]) => {
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

      const numOfCommits = commits.reduce((acc, dep) => acc + dep.length, 0);
      /* No commits since last release so don't bump. */
      if (numOfCommits === 0) {
        return of(null);
      }

      const dependencyChecks$ = dependencyRoots.map((root) => {
        const tagPrefix = resolveTagPrefix({
          versionTagPrefix,
          projectName: root.name,
          syncVersions: !!syncVersions,
        });

        const { lastVersion$, commits$ } = getVersionMetadata(
          tagPrefix,
          dependencyRoots.map((d) => d.path)
        );

        return forkJoin([lastVersion$, commits$]).pipe(
          switchMap(([lastVersion, commits]) => {
            const numOfCommits = commits.reduce(
              (acc, dep) => acc + dep.length,
              0
            );
            /* No commits since last release so don't bump. */
            if (numOfCommits === 0) {
              return of(null);
            }
            return _semverBump({
              since: lastVersion,
              preset,
              projectRoot: root.path,
              tagPrefix,
            }).pipe(
              switchMap((version) => {
                const rtn = {
                  type: 'dependency',
                  version,
                  dependencyName: root.name,
                } as Version;

                return of(rtn);
              })
            );
          })
        );
      });

      const projectBump$ = _semverBump({
        since: lastVersion,
        preset,
        projectRoot,
        tagPrefix,
      }).pipe(
        switchMap((version) => of({ type: 'project', version } as Version))
      );

      const rtn = forkJoin(dependencyChecks$.concat(projectBump$)).pipe(
        map((versions) => {
          return versions.reduce(
            (acc, v) => {
              if (v === null) return acc;
              if (
                v.type === 'dependency' &&
                v.version !== null &&
                v.version !== '0.0.0'
              ) {
                acc.dependencyUpdates.push(v);
              } else if (v.type === 'project' && v.version !== null) {
                acc.version = v.version;
              }
              return acc;
            },
            { version: lastVersion, dependencyUpdates: [] } as TryBumpReturn
          );
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
