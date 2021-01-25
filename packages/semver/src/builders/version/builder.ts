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
  generateSubChangelogs,
  getChangelogFiles,
  getChangelogPath,
  getPackageFiles,
  getProjectRoot,
  hasChangelog,
  tryPushToGitRemote,
} from './utils';

export function runBuilder(
  options: VersionBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  const {
    push,
    remote,
    dryRun,
    baseBranch,
    noVerify,
    syncVersions,
    rootChangelog,
  } = options;

  function createStandardVersionOpts({
    projectRoot,
    availablePackageFiles,
  }: {
    projectRoot: string;
    availablePackageFiles: string[];
  }): standardVersion.Options {
    const packageFiles = [resolve(projectRoot, 'package.json')];
    const bumpFiles = syncVersions ? availablePackageFiles : packageFiles;
    const rootChangelogPath = getChangelogPath(projectRoot);
    const firstRelease = hasChangelog(projectRoot) === false;
    const infile = rootChangelog ? rootChangelogPath : undefined;

    const options: standardVersion.Options = {
      silent: false,
      path: projectRoot,
      dryRun,
      infile,
      noVerify,
      firstRelease,
      packageFiles,
      bumpFiles,
      preset,
    };

    if (syncVersions === false) {
      options.tagPrefix = `${context.target.project}-`;
    }

    return options;
  }

  const projectRoot$ = from(getProjectRoot(context));
  const availablePackageFiles$ = getPackageFiles(context.workspaceRoot);
  const availableChangelogFiles$ = getChangelogFiles(context.workspaceRoot);
  const preset = require.resolve('conventional-changelog-angular');

  const generateSubChangelogs$ = iif(
    () => syncVersions,
    from(availableChangelogFiles$).pipe(
      switchMap(generateSubChangelogs({ preset, dryRun }))
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
