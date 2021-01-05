import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { resolve } from 'path';
import { combineLatest, from, Observable, of } from 'rxjs';
import { catchError, mapTo, switchMap, switchMapTo } from 'rxjs/operators';
import * as standardVersion from 'standard-version';
import { VersionBuilderSchema } from './schema';
import {
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
  const { push, remote, dryRun, baseBranch, noVerify, syncVersions } = options;

  const projectRoot$ = from(getProjectRoot(context));
  const availablePackageFiles$ = getPackageFiles(context.workspaceRoot);

  return combineLatest([projectRoot$, availablePackageFiles$]).pipe(
    switchMap(([projectRoot, availablePackageFiles]) => {
      const packageFiles = [resolve(projectRoot, 'package.json')];
      const bumpFiles = syncVersions ? availablePackageFiles : packageFiles;
      const changelogPath = getChangelogPath(projectRoot);
      const firstRelease = hasChangelog(projectRoot) === false;

      return standardVersion({
        silent: false,
        path: projectRoot,
        dryRun,
        noVerify,
        firstRelease,
        tagPrefix: syncVersions === false ? `${context.target.project}-` : null,
        infile: changelogPath,
        packageFiles,
        bumpFiles,
        preset: require.resolve('conventional-changelog-angular'),
      });
    }),
    push && dryRun === false
      ? switchMapTo(
          tryPushToGitRemote({
            branch: baseBranch,
            remote,
            noVerify,
            context,
          })
        )
      : mapTo(undefined),
    mapTo({ success: true }),
    catchError((error) => {
      context.logger.error(error);
      context.reportStatus('Error');
      return of({ success: false });
    })
  );
}

export default createBuilder(runBuilder);
