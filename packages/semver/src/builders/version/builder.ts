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
  generateSubChangelog,
  getChangelogFiles,
  getChangelogPath,
  getPackageFiles,
  getProjectRoot,
  hasChangelog,
  tryPushToGitRemote,
} from './utils';
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
  // otherwise, use the returned version with `generateSubChangelogs`
  // in sync mode
  const {
    push,
    remote,
    dryRun,
    baseBranch,
    noVerify,
    syncVersions,
    rootChangelog,
  } = options;

  const tagPrefix = syncVersions ? 'v' : `${context.target.project}-`;

  function createStandardVersionOpts({
    projectRoot,
    availablePackageFiles,
  }: {
    projectRoot: string;
    availablePackageFiles: string[];
  }): standardVersion.Options {
    const packageFiles = [resolve(projectRoot, 'package.json')];
    const bumpFiles = syncVersions ? availablePackageFiles : packageFiles;
    const changelogPath = getChangelogPath(projectRoot);
    const firstRelease = hasChangelog(projectRoot) === false;
    const infile = !syncVersions || rootChangelog ? changelogPath : undefined;

    return {
      silent: false,
      path: projectRoot,
      dryRun,
      infile,
      noVerify,
      firstRelease,
      packageFiles,
      bumpFiles,
      preset,
      tagPrefix,
    };
  }

  const projectRoot$ = from(getProjectRoot(context));
  const availablePackageFiles$ = getPackageFiles(context.workspaceRoot);
  const availableChangelogFiles$ = getChangelogFiles(context.workspaceRoot);
  const newVersion$ = projectRoot$.pipe(
    switchMap((projectRoot) => tryBump({ projectRoot, tagPrefix }))
  );
  const preset = 'angular';

  const generateSubChangelogs$ = iif(
    () => syncVersions && _isWip,
    forkJoin([newVersion$, availableChangelogFiles$]).pipe(
      switchMap(([newVersion, availableChangelogFiles]) => {
        return concat(
          ...availableChangelogFiles.map(({ projectRoot, changelogFile }) => {
            return generateSubChangelog({
              dryRun,
              projectRoot,
              changelogFile,
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
    availablePackageFiles$,
  ]).pipe(
    switchMap(([projectRoot, availablePackageFiles]) =>
      standardVersion(
        createStandardVersionOpts({
          projectRoot,
          availablePackageFiles,
        })
      )
    )
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
