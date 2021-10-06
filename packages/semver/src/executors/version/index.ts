import { logger } from '@nrwl/devkit';
import { concat, defer, of } from 'rxjs';
import { catchError, mapTo, switchMap } from 'rxjs/operators';

import { tryPushToGitRemote } from './utils/git';
import { executePostTargets } from './utils/post-target';
import { resolveInterpolation } from './utils/resolve-interpolation';
import { tryBump } from './utils/try-bump';
import { getProjectRoot } from './utils/workspace';
import { versionProject, versionWorkspace } from './version';

import type { ExecutorContext } from '@nrwl/devkit';
import type { CommonVersionOptions } from './version';
import type { VersionBuilderSchema } from './schema';

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
    releaseAs,
    preid,
    changelogHeader,
    versionTagPrefix,
    postTargets,
  }: VersionBuilderSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const workspaceRoot = context.root;
  const preset = 'angular';

  // @todo: refactor this in a dedicated function without a chained ternary.
  const tagPrefix =
    versionTagPrefix !== undefined
      ? resolveInterpolation(versionTagPrefix, {
          target: context.projectName,
          projectName: context.projectName,
        })
      : syncVersions
      ? 'v'
      : `${context.projectName}-`;

  const projectRoot = getProjectRoot(context);
  const newVersion$ = tryBump({
    preset,
    projectRoot,
    tagPrefix,
    releaseType: releaseAs ?? version,
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

      /**
       * @todo 3.0.0: remove this in favor of @jscutlery/semver:push postTarget.
       */
      const pushToGitRemote$ = defer(() =>
        tryPushToGitRemote({
          branch: baseBranch,
          noVerify,
          remote,
        })
      );

      return concat(
        runStandardVersion$,
        ...(push && dryRun === false ? [pushToGitRemote$] : []),
        dryRun === false
          ? executePostTargets({
              postTargets,
              options: {
                version: newVersion,
                tagPrefix,
                noVerify,
                dryRun,
                remote,
                baseBranch,
              },
              context,
            })
          : []
      );
    })
  );

  return action$
    .pipe(
      mapTo({ success: true }),
      catchError((error) => {
        logger.error(error.stack ?? error.toString());
        return of({ success: false });
      })
    )
    .toPromise();
}
