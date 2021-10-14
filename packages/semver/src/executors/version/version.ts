import { resolve } from 'path';
import { concat, forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import standardVersion from 'standard-version';

import {
  defaultHeader,
  getChangelogPath,
  updateChangelog,
} from './utils/changelog';
import { addToStage } from './utils/git';
import { getPackageFiles, getProjectRoots } from './utils/workspace';

export interface CommonVersionOptions {
  dryRun: boolean;
  newVersion: string;
  noVerify: boolean;
  preset: string;
  projectRoot: string;
  tagPrefix: string;
  changelogHeader?: string;
}

export function versionWorkspace({
  skipRootChangelog,
  workspaceRoot,
  ...options
}: {
  skipRootChangelog: boolean;
  skipProjectChangelog: boolean;
  workspaceRoot: string;
} & CommonVersionOptions) {
  return concat(
    getProjectRoots(workspaceRoot).pipe(
      switchMap((projectRoots) =>
        _generateProjectChangelogs({
          workspaceRoot,
          projectRoots,
          ...options,
        })
      ),
      /* Run Git add only once, after changelogs get generated in parallel. */
      switchMap((changelogPaths) =>
        addToStage({ paths: changelogPaths, dryRun: options.dryRun })
      )
    ),
    getPackageFiles(workspaceRoot).pipe(
      switchMap((packageFiles) =>
        _runStandardVersion({
          bumpFiles: packageFiles,
          skipChangelog: skipRootChangelog,
          ...options,
        })
      )
    )
  );
}

export function versionProject(options: CommonVersionOptions) {
  return _runStandardVersion({
    bumpFiles: [resolve(options.projectRoot, 'package.json')],
    skipChangelog: false,
    ...options,
  });
}

/**
 * Generate project's changelogs and return an array containing their path.
 * Skip generation if --skip-project-changelog enabled and return an empty array.
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

export function _runStandardVersion({
  bumpFiles,
  dryRun,
  projectRoot,
  newVersion,
  noVerify,
  preset,
  tagPrefix,
  skipChangelog,
  changelogHeader = defaultHeader,
}: {
  bumpFiles: string[];
  skipChangelog: boolean;
} & CommonVersionOptions) {
  return standardVersion({
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
    noVerify,
    packageFiles: [resolve(projectRoot, 'package.json')],
    path: projectRoot,
    preset,
    tagPrefix,
    skip: {
      changelog: skipChangelog,
    },
  });
}
