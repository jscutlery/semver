import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { noop } from '@angular-devkit/schematics';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { from, Observable, of } from 'rxjs';
import { catchError, map, mapTo, switchMap, switchMapTo } from 'rxjs/operators';
import { release } from './release';

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
    syncVersions,
  } = options;

  return from(getProjectRoot(context)).pipe(
    switchMap((projectRoot) =>
      getPackageFiles(context.workspaceRoot).pipe(
        map((packageFiles) => ({ projectRoot, packageFiles }))
      )
    ),
    switchMap(({ projectRoot, packageFiles }) => {
      const bumpFiles = syncVersions
        ? packageFiles
        : [resolve(projectRoot, 'package.json')];
      const changelogPath = resolve(projectRoot, 'CHANGELOG.md');
      const firstRelease = existsSync(changelogPath) === false;

      return release({
        silent: false,
        path: projectRoot,
        dryRun,
        noVerify,
        firstRelease,
        tagPrefix: syncVersions === false ? `${context.target.project}-` : null,
        infile: changelogPath,
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
