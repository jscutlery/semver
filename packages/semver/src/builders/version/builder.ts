import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { concat, forkJoin, Observable, of } from 'rxjs';
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
    rootChangelog,
    plugins,
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
    switchMap((projectRoot) => tryBump({ preset, projectRoot, tagPrefix }))
  );
  const pluginHandler = createPluginHandler({ plugins });

  const action$ = forkJoin([projectRoot$, newVersion$]).pipe(
    switchMap(([projectRoot, newVersion]) => {
      if (newVersion == null) {
        console.info('⏹ nothing changed since last release');
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
      const runStandardVersion$ = syncVersions
        ? versionWorkspace({
            ...options,
            rootChangelog,
            workspaceRoot,
          })
        : versionProject(options);

      const pushToGitRemote$ = tryPushToGitRemote({
        branch: baseBranch,
        context,
        noVerify,
        remote,
      });

      return concat(
        runStandardVersion$,
        ...(push && dryRun === false ? [pushToGitRemote$] : []),
        pluginHandler.publish() // @todo handle dryRun
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
