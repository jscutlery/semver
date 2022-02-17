import { logger } from '@nrwl/devkit';
import { SchemaError } from '@nrwl/tao/src/shared/params';
import { concat, defer, lastValueFrom, of } from 'rxjs';
import { catchError, concatMap, reduce, switchMap } from 'rxjs/operators';

import {
  calculateChangelogChanges,
  defaultHeader,
  getChangelogPath,
} from './utils/changelog';
import {
  DependencyRoot,
  getDependencyRoots,
} from './utils/get-project-dependencies';
import { tryPushToGitRemote } from './utils/git';
import { runPostTargets } from './utils/post-target';
import { formatTag, resolveTagPrefix } from './utils/tag';
import { tryBump } from './utils/try-bump';
import { getProjectRoot } from './utils/workspace';
import { versionProject, versionWorkspace } from './version';

import type { ExecutorContext } from '@nrwl/devkit';
import type { CommonVersionOptions } from './version';
import type { VersionBuilderSchema } from './schema';

export default async function version(
  options: VersionBuilderSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const {
    push,
    remote,
    dryRun,
    trackDeps,
    baseBranch,
    noVerify,
    syncVersions,
    skipRootChangelog,
    skipProjectChangelog,
    releaseAs,
    preid,
    changelogHeader,
    versionTagPrefix,
    postTargets,
    commitMessageFormat,
  } = normalizeOptions(options);
  const workspaceRoot = context.root;
  const projectName = context.projectName as string;
  const preset = 'angular';

  const tagPrefix = resolveTagPrefix({
    versionTagPrefix,
    projectName,
    syncVersions,
  });

  let dependencyRoots: DependencyRoot[] = [];
  try {
    dependencyRoots = await getDependencyRoots({
      projectName,
      releaseAs,
      trackDeps,
      context,
    });
  } catch (e) {
    logger.error('Failed to determine dependencies.');
    return { success: false };
  }

  const projectRoot = getProjectRoot(context);
  const newVersion$ = tryBump({
    preset,
    projectRoot,
    dependencyRoots,
    tagPrefix,
    releaseType: releaseAs,
    preid,
    versionTagPrefix,
    syncVersions,
  });

  const action$ = newVersion$.pipe(
    switchMap((newVersion) => {
      if (newVersion == null) {
        logger.info('⏹ Nothing changed since last release.');
        return of({ success: true });
      }

      const options: CommonVersionOptions = {
        dryRun,
        trackDeps,
        newVersion: newVersion.version,
        noVerify,
        preset,
        projectRoot,
        tagPrefix,
        changelogHeader,
        commitMessageFormat,
        projectName,
        skipProjectChangelog,
        dependencyUpdates: newVersion.dependencyUpdates,
      };

      const runStandardVersion$ = defer(() =>
        syncVersions
          ? versionWorkspace({
              ...options,
              workspaceRoot,
              skipRootChangelog,
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

      const changelogPath = getChangelogPath(
        syncVersions ? workspaceRoot : projectRoot
      );

      /**
       * 1. Calculate new version
       * 2. Release (create changelog -> add to stage -> commit -> tag)
       * 3. Calculate changelog changes
       * 4. Push to Git
       * 5. Run post targets
       */
      return runStandardVersion$.pipe(
        calculateChangelogChanges({
          changelogHeader,
          changelogPath,
        }),
        concatMap((notes) =>
          concat(
            ...(push && dryRun === false ? [pushToGitRemote$] : []),
            ...(dryRun === false
              ? [
                  runPostTargets({
                    postTargets,
                    options: {
                      project: context.projectName,
                      version: newVersion.version,
                      tag: formatTag({
                        tagPrefix,
                        lastVersion: newVersion.version,
                      }),
                      tagPrefix,
                      noVerify,
                      dryRun,
                      remote,
                      baseBranch,
                      notes,
                    },
                    context,
                  }),
                ]
              : [])
          )
        ),
        reduce((result) => result, { success: true })
      );
    })
  );

  return lastValueFrom(
    action$.pipe(
      catchError((error) => {
        if (error instanceof SchemaError) {
          logger.error(`Post-targets Error: ${error.message}`);
        } else {
          logger.error(error.stack ?? error.toString());
        }

        return of({ success: false });
      })
    )
  );
}

function normalizeOptions(options: VersionBuilderSchema) {
  return {
    ...options,
    push: options.push as boolean,
    remote: options.remote as string,
    dryRun: options.dryRun as boolean,
    trackDeps: options.trackDeps as boolean,
    baseBranch: options.baseBranch as string,
    noVerify: options.noVerify as boolean,
    syncVersions: options.syncVersions as boolean,
    skipRootChangelog: options.skipRootChangelog as boolean,
    skipProjectChangelog: options.skipProjectChangelog as boolean,
    releaseAs: options.releaseAs ?? options.version,
    changelogHeader: options.changelogHeader ?? defaultHeader,
  };
}
