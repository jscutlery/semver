import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { concat, defer, forkJoin, Observable, of } from 'rxjs';
import { catchError, mapTo, shareReplay, switchMap } from 'rxjs/operators';

import { createPluginHandler } from './plugin-handler';
import { VersionBuilderSchema } from './schema';
import { tryPushToGitRemote } from './utils/git';
import { tryBump } from './utils/try-bump';
import { getProjectRoot } from './utils/workspace';
import { CommonVersionOptions, versionProject, versionWorkspace } from './version';

export function runBuilder(
  {
    push,
    remote,
    dryRun,
    baseBranch,
    noVerify,
    syncVersions,
    skipRootChangelog,
    plugins,
    version,
    preid,
  }: VersionBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  const { workspaceRoot } = context;
  const preset = 'angular';
  const tagPrefix = syncVersions ? 'v' : `${context.target.project}-`;

  const projectRoot$ = getProjectRoot(context).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  const newVersion$ = projectRoot$.pipe(
    switchMap((projectRoot) => tryBump({
      preset,
      projectRoot,
      tagPrefix,
      releaseType: version,
      preid,
      logger: context.logger,
    }))
  );

  const action$ = forkJoin([projectRoot$, newVersion$]).pipe(
    switchMap(([projectRoot, newVersion]) => {
      if (newVersion == null) {
        context.logger.info('⏹ Nothing changed since last release.');
        return of(undefined);
      }

      const options: CommonVersionOptions = {
        dryRun,
        newVersion,
        noVerify,
        preset,
        projectRoot,
        tagPrefix,
      };

      const pluginHandler = createPluginHandler({ plugins, options, context });

      /* 1. Validate */
      const validate$ = defer(() => pluginHandler.validate());

      /* 2. Version */
      const runStandardVersion$ = defer(() =>
        syncVersions
          ? versionWorkspace({
              ...options,
              skipRootChangelog,
              workspaceRoot,
            })
          : versionProject(options)
      );
      /* 3. Push */
      const pushToGitRemote$ = defer(() =>
        tryPushToGitRemote({
          branch: baseBranch,
          noVerify,
          remote,
        })
      );
      /* 4. Publish */
      const publish$ = defer(() => pluginHandler.publish());

      return concat(
        validate$,
        runStandardVersion$,
        ...(push && dryRun === false ? [pushToGitRemote$] : []),
        ...(dryRun === false ? [publish$] : [])
      );
    })
  );

  return action$.pipe(
    mapTo({ success: true }),
    catchError((error) => {
      context.logger.error(error.stack ?? error.toString());
      context.reportStatus('Error');
      return of({ success: false });
    })
  );
}

export default createBuilder(runBuilder);
