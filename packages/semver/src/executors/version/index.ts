import { ExecutorContext, logger } from '@nrwl/devkit';
import { concat, defer, of } from 'rxjs';
import { catchError, mapTo, switchMap } from 'rxjs/operators';

import { VersionBuilderSchema } from './schema';
import { tryPushToGitRemote } from './utils/git';
import { tryBump } from './utils/try-bump';
import { getProjectRoot } from './utils/workspace';
import { resolveTagTemplate } from './utils/tag-template';
import { CommonVersionOptions, versionProject, versionWorkspace } from './version';

export default function version(
  {
    push,
    remote,
    dryRun,
    baseBranch,
    noVerify,
    syncVersions,
    skipRootChangelog,
    skipProjectChangelog,
    version,
    preid,
    changelogHeader,
    versionTagPrefix,
  }: VersionBuilderSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const workspaceRoot = context.root;
  const preset = 'angular';
  const tagPrefix = versionTagPrefix ? resolveTagTemplate(versionTagPrefix,
      { target: context.projectName, projectName: context.projectName })
    : (syncVersions ? 'v' : `${context.projectName}-`);

  const projectRoot = getProjectRoot(context);
  const newVersion$ = tryBump({
    preset,
    projectRoot,
    tagPrefix,
    releaseType: version,
    preid,
  });

  const action$ = newVersion$.pipe(
    switchMap((newVersion) => {
      if (newVersion == null) {
        logger.info('⏹ Nothing changed since last release.');
        return of(undefined);
      }

      const options: CommonVersionOptions = {
        dryRun,
        newVersion,
        noVerify,
        preset,
        projectRoot,
        tagPrefix,
        changelogHeader,
      };

      const runStandardVersion$ = defer(() =>
        syncVersions
          ? versionWorkspace({
              ...options,
              skipRootChangelog,
              skipProjectChangelog,
              workspaceRoot,
            })
          : versionProject(options)
      );
      const pushToGitRemote$ = defer(() =>
        tryPushToGitRemote({
          branch: baseBranch,
          noVerify,
          remote,
        })
      );

      return concat(
        runStandardVersion$,
        ...(push && dryRun === false ? [pushToGitRemote$] : [])
      );
    })
  );

  return action$.pipe(
    mapTo({ success: true }),
    catchError((error) => {
      logger.error(error.stack ?? error.toString());
      return of({ success: false });
    })
  ).toPromise();
}
