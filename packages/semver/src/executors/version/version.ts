import { resolve } from 'path';
import { forkJoin, noop, Observable, of } from 'rxjs';
import { concatMap, reduce, switchMap } from 'rxjs/operators';
import * as standardVersion from 'standard-version';

import { getChangelogPath, updateChangelog } from './utils/changelog';
import { addToStage } from './utils/git';
import { resolveInterpolation } from './utils/resolve-interpolation';
import { getPackageFiles, getProjectRoots } from './utils/workspace';

export interface CommonVersionOptions {
  dryRun: boolean;
  trackDeps: boolean;
  newVersion: string;
  noVerify: boolean;
  preset: string;
  projectRoot: string;
  tagPrefix: string;
  changelogHeader?: string;
  commitMessageFormat?: string;
  projectName: string;
  skipProjectChangelog: boolean;
}

export function versionWorkspace({
  skipRootChangelog,
  workspaceRoot,
  ...options
}: {
  skipRootChangelog: boolean;
  workspaceRoot: string;
} & CommonVersionOptions) {
  return getProjectRoots(workspaceRoot).pipe(
    concatMap((projectRoots) =>
      _generateProjectChangelogs({
        workspaceRoot,
        projectRoots,
        ...options,
      })
    ),
    /* Run Git add only once, after changelogs get generated in parallel. */
    concatMap((changelogPaths) =>
      addToStage({ paths: changelogPaths, dryRun: options.dryRun })
    ),
    reduce(noop),
    concatMap(() =>
      getPackageFiles(workspaceRoot).pipe(
        switchMap((packageFiles) =>
          _runStandardVersion({
            bumpFiles: packageFiles,
            skipChangelog: skipRootChangelog,
            ...options,
          })
        )
      )
    )
  );
}

export function versionProject(options: CommonVersionOptions) {
  return _runStandardVersion({
    bumpFiles: [resolve(options.projectRoot, 'package.json')],
    skipChangelog: options.skipProjectChangelog,
    ...options,
  });
}

/**
 * Generate project's changelogs and return an array containing their path.
 * Skip generation if --skip-project-changelog enabled and return an empty array.
 *
 * istanbul ignore next
 */
export function _generateProjectChangelogs({
  projectRoots,
  workspaceRoot,
  ...options
}: CommonVersionOptions & {
  skipProjectChangelog: boolean;
  projectRoots: string[];
  workspaceRoot: string;
}): Observable<string[]> {
  if (options.skipProjectChangelog) {
    return of([]);
  }

  return forkJoin(
    projectRoots
      /* Don't update the workspace's changelog as it will be
       * dealt with by `standardVersion`. */
      .filter((projectRoot) => projectRoot !== workspaceRoot)
      .map((projectRoot) =>
        updateChangelog({
          dryRun: options.dryRun,
          preset: options.preset,
          projectRoot,
          newVersion: options.newVersion,
        })
      )
  );
}

/* istanbul ignore next */
export function _createCommitMessageFormatConfig({
  projectName,
  commitMessageFormat,
}: {
  projectName: string;
  commitMessageFormat: string | undefined;
}) {
  return typeof commitMessageFormat === 'string'
    ? {
        releaseCommitMessageFormat: resolveInterpolation(commitMessageFormat, {
          projectName,
          /* Standard Version do the interpolation itself if we pass {{currentTag}} in the commit message format. */
          version: '{{currentTag}}',
        }) as string,
      }
    : {};
}

/* istanbul ignore next */
export async function _runStandardVersion({
  bumpFiles,
  dryRun,
  projectRoot,
  newVersion,
  noVerify,
  preset,
  tagPrefix,
  skipChangelog,
  projectName,
  commitMessageFormat,
  changelogHeader,
}: {
  bumpFiles: string[];
  skipChangelog: boolean;
} & Omit<CommonVersionOptions, 'skipProjectChangelog'>) {
  await standardVersion({
    bumpFiles,
    /* Make sure that we commit the manually generated changelogs that
     * we staged. */
    commitAll: true,
    dryRun,
    header: changelogHeader,
    infile: getChangelogPath(projectRoot),
    /* Control version to avoid different results between the value
     * returned by `tryBump` and the one computed by standard-version. */
    releaseAs: newVersion,
    silent: false,

    /* @Notice: For an obscure reason standard-version checks for `verify` instead of `no-verify`,
     * Here is the source code: https://github.com/conventional-changelog/standard-version/blob/095e1ebc1ab393c202984b694395224a6888b825/lib/lifecycles/commit.js#L19 */
    ...({ verify: noVerify === false } as any),

    packageFiles: [resolve(projectRoot, 'package.json')],
    path: projectRoot,
    preset,
    tagPrefix,

    /* @Notice: conditionally sets the config to avoid having `undefined` as a commit message. */
    ..._createCommitMessageFormatConfig({
      commitMessageFormat,
      projectName,
    }),

    skip: {
      changelog: skipChangelog,
    },
  });
}
