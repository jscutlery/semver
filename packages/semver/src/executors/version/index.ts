import { logger } from '@nrwl/devkit';
import { SchemaError } from '@nrwl/tao/src/shared/params';
import { concat, defer, lastValueFrom, of } from 'rxjs';
import { catchError, mapTo, switchMap } from 'rxjs/operators';

import { tryPushToGitRemote } from './utils/git';
import { executePostTargets } from './utils/post-target';
import { resolveTagPrefix } from './utils/resolve-tag-prefix';
import { tryBump } from './utils/try-bump';
import { getProjectRoot } from './utils/workspace';
import { versionProject, versionWorkspace } from './version';

import type { ExecutorContext } from '@nrwl/devkit';
import type { CommonVersionOptions } from './version';
import type { VersionBuilderSchema } from './schema';
import { getProjectDependencies } from './utils/get-project-dependencies';

export default async function version(
  {
    push,
    remote,
    dryRun,
    useDeps,
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

  const tagPrefix = resolveTagPrefix({
    versionTagPrefix,
    projectName: context.projectName as string,
    syncVersions: syncVersions as boolean
  });

  const projectRoot = getProjectRoot(context);

  let dependencyRoots = [];
  if (useDeps && !version) {
    // Include any depended-upon libraries in determining the version bump.
    try {
      const dependencyLibs = await getProjectDependencies(context.projectName);
      dependencyRoots = dependencyLibs
        .map(name => context.workspace.projects[name].root);
    } catch (e) {
      logger.error('Failed to determine dependencies.');
      return Promise.resolve(e);
    }
  }

  const newVersion$ = tryBump({
    preset,
    projectRoot,
    dependencyRoots,
    tagPrefix,
    releaseType: releaseAs ?? version,
    preid,
  });

  const action$ = newVersion$.pipe(
    switchMap((newVersion) => {
      if (newVersion === undefined) {
        logger.info('⏹ Nothing changed since last release.');
        return of(undefined);
      }

      const options: CommonVersionOptions = {
        dryRun: dryRun as boolean,
        useDeps,
        newVersion,
        noVerify: noVerify as boolean,
        preset,
        projectRoot,
        tagPrefix,
        changelogHeader,
      };

      const runStandardVersion$ = defer(() =>
        syncVersions
          ? versionWorkspace({
              ...options,
              skipRootChangelog: skipRootChangelog as boolean,
              skipProjectChangelog: skipProjectChangelog as boolean,
              workspaceRoot,
            })
          : versionProject(options)
      );

      /**
       * @todo 3.0.0: remove this in favor of @jscutlery/semver:push postTarget.
       */
      const pushToGitRemote$ = defer(() =>
        tryPushToGitRemote({
          branch: baseBranch as string,
          noVerify: noVerify as boolean,
          remote: remote as string,
        })
      );

      return concat(
        runStandardVersion$,
        ...(push && dryRun === false ? [pushToGitRemote$] : []),
        dryRun === false
          ? executePostTargets({
              postTargets,
              resolvableOptions: {
                project: context.projectName,
                version: newVersion,
                tag: `${tagPrefix}${newVersion}`,
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

  return lastValueFrom(action$
    .pipe(
      mapTo({ success: true }),
      catchError((error) => {
        if (error instanceof SchemaError) {
          logger.error(`Post-targets Error: ${error.message}`);
        } else {
          logger.error(error.stack ?? error.toString());
        }

        return of({ success: false });
      })
    ));
}
