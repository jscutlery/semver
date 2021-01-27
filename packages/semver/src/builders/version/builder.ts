import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { resolve } from 'path';
import { concat, forkJoin, Observable, of } from 'rxjs';
import { catchError, mapTo, switchMap } from 'rxjs/operators';
import * as standardVersion from 'standard-version';

import { VersionBuilderSchema } from './schema';
import {
  defaultHeader,
  getChangelogPath,
  updateChangelog,
} from './utils/changelog';
import { tryPushToGitRemote } from './utils/git';
import { tryBump } from './utils/try-bump';
import {
  getPackageFiles,
  getProjectRoot,
  getProjectRoots,
} from './utils/workspace';

// @todo get rid of this
let _isWip = process.env['JSCUTLERY_SEMVER_WIP'] === 'true';

export function _enableWip() {
  _isWip = true;
}

export function runBuilder(
  {
    push,
    remote,
    dryRun,
    baseBranch,
    noVerify,
    syncVersions,
    rootChangelog,
  }: VersionBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  // @todo handling both sync and independent mode is getting hacky
  // we should split this into two distinct functions sharing common functions
  // @todo call bump
  // if bump returns null => noop
  const { workspaceRoot } = context;
  const preset = 'angular';
  const tagPrefix = syncVersions ? 'v' : `${context.target.project}-`;

  const projectRoot$ = getProjectRoot(context);
  const newVersion$ = projectRoot$.pipe(
    switchMap((projectRoot) => tryBump({ preset, projectRoot, tagPrefix }))
  );

  const runStandardVersion$ = forkJoin([projectRoot$, newVersion$]).pipe(
    switchMap(([projectRoot, newVersion]) =>
      syncVersions
        ? _versionWorkspace({
            dryRun,
            newVersion,
            noVerify,
            preset,
            projectRoot,
            rootChangelog,
            tagPrefix,
            workspaceRoot,
          })
        : _versionProject({
            dryRun,
            newVersion,
            noVerify,
            preset,
            projectRoot,
            tagPrefix,
          })
    )
  );

  const pushToGitRemote$ = tryPushToGitRemote({
    branch: baseBranch,
    context,
    noVerify,
    remote,
  });

  return concat(
    runStandardVersion$,
    ...(push && dryRun === false ? [pushToGitRemote$] : [])
  ).pipe(
    mapTo({ success: true }),
    catchError((error) => {
      context.logger.error(error);
      context.reportStatus('Error');
      return of({ success: false });
    })
  );
}

function _versionWorkspace({
  dryRun,
  newVersion,
  noVerify,
  preset,
  projectRoot,
  rootChangelog,
  tagPrefix,
  workspaceRoot,
}: {
  dryRun: boolean;
  newVersion: string;
  noVerify: boolean;
  preset: string;
  projectRoot: string;
  rootChangelog: boolean;
  tagPrefix: string;
  workspaceRoot: string;
}) {
  return concat(
    ...[
      _isWip
        ? getProjectRoots(workspaceRoot).pipe(
            switchMap((projectRoots) =>
              concat(
                ...projectRoots
                  /* Don't update the workspace's changelog as it will be
                   * dealt with by `standardVersion`. */
                  .filter((projectRoot) => projectRoot !== workspaceRoot)
                  .map((projectRoot) =>
                    updateChangelog({
                      dryRun,
                      preset,
                      projectRoot,
                      newVersion,
                    })
                  )
              )
            )
          )
        : [],
      getPackageFiles(workspaceRoot).pipe(
        switchMap((packageFiles) =>
          _runStandardVersion({
            bumpFiles: packageFiles,
            dryRun,
            projectRoot,
            newVersion,
            noVerify,
            preset,
            tagPrefix,
            skipChangelog: !rootChangelog,
          })
        )
      ),
    ]
  );
}

function _versionProject({
  dryRun,
  newVersion,
  noVerify,
  preset,
  projectRoot,
  tagPrefix,
}: {
  dryRun: boolean;
  newVersion: string;
  noVerify: boolean;
  preset: string;
  projectRoot: string;
  tagPrefix: string;
}) {
  return _runStandardVersion({
    bumpFiles: [resolve(projectRoot, 'package.json')],
    dryRun,
    projectRoot,
    newVersion,
    noVerify,
    preset,
    tagPrefix,
    skipChangelog: false,
  });
}

function _runStandardVersion({
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
  dryRun: boolean;
  projectRoot: string;
  newVersion: string;
  noVerify: boolean;
  preset: string;
  tagPrefix: string;
  skipChangelog: boolean;
}) {
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

export default createBuilder(runBuilder);
