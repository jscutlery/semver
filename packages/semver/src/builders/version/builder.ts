import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { concat, forkJoin, Observable, of } from 'rxjs';
import { catchError, mapTo, switchMap } from 'rxjs/operators';

import { VersionBuilderSchema } from './schema';
import { tryPushToGitRemote } from './utils/git';
import { tryBump } from './utils/try-bump';
import { getProjectRoot } from './utils/workspace';
import {
  CommonVersionOptions,
  versionProject,
  versionWorkspace,
} from './version';

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
    switchMap(([projectRoot, newVersion]) => {
      const options: CommonVersionOptions = {
        dryRun,
        newVersion,
        noVerify,
        preset,
        projectRoot,
        tagPrefix,
      };
      return syncVersions
        ? versionWorkspace({
            ...options,
            rootChangelog,
            workspaceRoot,
          })
        : versionProject(options);
    })
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

export default createBuilder(runBuilder);
