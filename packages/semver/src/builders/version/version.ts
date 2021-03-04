import { resolve } from 'path';
import { concat, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as standardVersion from 'standard-version';
import {
  defaultHeader,
  getChangelogPath,
  updateChangelog,
} from './utils/changelog';
import { gitAdd } from './utils/git';
import { getPackageFiles, getProjectRoots } from './utils/workspace';

export interface CommonVersionOptions {
  dryRun: boolean;
  newVersion: string;
  noVerify: boolean;
  preset: string;
  projectRoot: string;
  tagPrefix: string;
}

export function versionWorkspace({
  rootChangelog,
  workspaceRoot,
  ...options
}: {
  rootChangelog: boolean;
  workspaceRoot: string;
} & CommonVersionOptions) {
  return concat(
    ...[
      getProjectRoots(workspaceRoot).pipe(
        switchMap((projectRoots) =>
          forkJoin(
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
          )
        ),
        switchMap((changelogPaths) => gitAdd(changelogPaths))
      ),
      getPackageFiles(workspaceRoot).pipe(
        switchMap((packageFiles) =>
          _runStandardVersion({
            bumpFiles: packageFiles,
            skipChangelog: !rootChangelog,
            ...options,
          })
        )
      ),
    ]
  );
}

export function versionProject(options: CommonVersionOptions) {
  return _runStandardVersion({
    bumpFiles: [resolve(options.projectRoot, 'package.json')],
    skipChangelog: false,
    ...options,
  });
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
    header: defaultHeader,
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
