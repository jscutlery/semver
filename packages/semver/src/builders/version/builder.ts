import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { noop } from '@angular-devkit/schematics';
import { resolve } from 'path';
import { from, Observable, of } from 'rxjs';
import { catchError, map, mapTo, switchMap, switchMapTo } from 'rxjs/operators';
import * as standardVersion from 'standard-version';
import { VersionBuilderSchema } from './schema';
import { getPackageFiles, getProjectRoot, tryPushToGitRemote } from './utils';

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
    firstRelease,
    syncVersions,
  } = options;

  return from(getProjectRoot(context)).pipe(
    switchMap((projectRoot) =>
      getPackageFiles(projectRoot).pipe(
        map((packageFiles) => ({ projectRoot, packageFiles }))
      )
    ),
    switchMap(({ projectRoot, packageFiles }) => {
      const bumpFiles = syncVersions
        ? packageFiles
        : [resolve(projectRoot, 'package.json')];

      return standardVersion({
        silent: false,
        path: projectRoot,
        dryRun,
        noVerify,
        firstRelease,
        infile: resolve(projectRoot, 'CHANGELOG.md'),
        packageFiles: [resolve(projectRoot, 'package.json')],
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
      : mapTo(noop()),
    mapTo({ success: true }),
    catchError((error) => {
      context.logger.error(error);
      context.reportStatus('Error');
      return of({ success: false });
    })
  );
}

export default createBuilder(runBuilder);
