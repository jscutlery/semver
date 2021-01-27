import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { resolve } from 'path';
import { concat, forkJoin, from, iif, Observable, of } from 'rxjs';
import { catchError, mapTo, switchMap } from 'rxjs/operators';
import * as standardVersion from 'standard-version';

import { VersionBuilderSchema } from './schema';
import {
  getChangelogFiles,
  getChangelogPath,
  getPackageFiles,
  getProjectRoot,
  tryPushToGitRemote,
  updateChangelog,
} from './utils';
import { defaultHeader } from './utils/changelog';
import { tryBump } from './utils/try-bump';

// @todo get rid of this
let _isWip = process.env['JSCUTLERY_SEMVER_WIP'] === 'true';

export function _enableWip() {
  _isWip = true;
}

export function runBuilder(
  options: VersionBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  // @todo handling both sync and independent mode is getting hacky
  // we should split this into two distinct functions sharing common functions
  // @todo call bump
  // if bump returns null => noop
  const {
    push,
    remote,
    dryRun,
    baseBranch,
    noVerify,
    syncVersions,
    rootChangelog,
  } = options;

  const preset = 'angular';
  const tagPrefix = syncVersions ? 'v' : `${context.target.project}-`;

  const projectRoot$ = from(getProjectRoot(context));
  const availablePackageFiles$ = getPackageFiles(context.workspaceRoot);
  const availableChangelogFiles$ = getChangelogFiles(context.workspaceRoot);
  const newVersion$ = projectRoot$.pipe(
    switchMap((projectRoot) => tryBump({ preset, projectRoot, tagPrefix }))
  );

  const generateSubChangelogs$ = iif(
    () => syncVersions && _isWip,
    forkJoin([newVersion$, availableChangelogFiles$]).pipe(
      switchMap(([newVersion, availableChangelogFiles]) => {
        return concat(
          ...availableChangelogFiles
            /* Don't update the workspace's changelog as it will be
             * dealt with by `standardVersion`. */
            .filter(({ projectRoot }) => projectRoot !== context.workspaceRoot)
            .map(({ projectRoot }) => {
              return updateChangelog({
                dryRun,
                preset,
                projectRoot,
                newVersion,
              });
            })
        );
      })
    ),
    of(undefined)
  );

  const runStandardVersion$ = forkJoin([
    projectRoot$,
    newVersion$,
    availablePackageFiles$,
  ]).pipe(
    switchMap(([projectRoot, newVersion, availablePackageFiles]) => {
      const packageFiles = [resolve(projectRoot, 'package.json')];

      return standardVersion({
        bumpFiles: syncVersions ? availablePackageFiles : packageFiles,
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
        packageFiles,
        path: projectRoot,
        preset,
        tagPrefix,
        skip: {
          changelog: syncVersions && !rootChangelog,
        },
      });
    })
  );

  const pushToGitRemote$ = iif(
    () => push && dryRun === false,
    tryPushToGitRemote({
      branch: baseBranch,
      remote,
      noVerify,
      context,
    }),
    of(undefined)
  );

  return concat(
    generateSubChangelogs$,
    runStandardVersion$,
    pushToGitRemote$
  ).pipe(
    mapTo({ success: true }),
    catchError((error) => {
      context.logger.error(error);
      context.reportStatus('Error');
      return of({ success: false });
    })
  );
}

export default createBuilder(runBuilder);
