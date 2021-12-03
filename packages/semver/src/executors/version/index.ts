import { logger } from '@nrwl/devkit';
import { SchemaError } from '@nrwl/tao/src/shared/params';
import { concat, defer, lastValueFrom, of, OperatorFunction } from 'rxjs';
import { catchError, combineLatestWith, concatMap, reduce, switchMap } from 'rxjs/operators';

import { getProjectDependencies } from './utils/get-project-dependencies';
import { tryPushToGitRemote } from './utils/git';
import { executePostTargets } from './utils/post-target';
import { resolveTagPrefix } from './utils/resolve-tag-prefix';
import { tryBump } from './utils/try-bump';
import { getProjectRoot } from './utils/workspace';
import { versionProject, versionWorkspace } from './version';

import type { ExecutorContext } from '@nrwl/devkit';
import type { CommonVersionOptions } from './version';
import type { VersionBuilderSchema } from './schema';
import { getChangelogPath } from './utils/changelog';
import { readFileIfExists } from './utils/filesystem';
import { diff } from './utils/diff';

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
    version,
    releaseAs: _releaseAs,
    preid,
    changelogHeader,
    versionTagPrefix,
    postTargets,
    commitMessageFormat,
  } = normalizeOptions(options);
  const releaseAs = _releaseAs ?? version;
  const workspaceRoot = context.root;
  const projectName = context.projectName as string;
  const preset = 'angular';

  const tagPrefix = resolveTagPrefix({
    versionTagPrefix,
    projectName,
    syncVersions,
  });

  const projectRoot = getProjectRoot(context);

  let dependencyRoots: string[] = [];
  if (trackDeps && !releaseAs) {
    // Include any depended-upon libraries in determining the version bump.
    try {
      const dependencyLibs = await getProjectDependencies(projectName);
      dependencyRoots = dependencyLibs.map(
        (name) => context.workspace.projects[name].root
      );
    } catch (e) {
      logger.error('Failed to determine dependencies.');
      return Promise.reject(e);
    }
  }

  const newVersion$ = tryBump({
    preset,
    projectRoot,
    dependencyRoots,
    tagPrefix,
    releaseType: releaseAs,
    preid,
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
        newVersion: newVersion,
        noVerify,
        preset,
        projectRoot,
        tagPrefix,
        changelogHeader,
        commitMessageFormat,
        projectName,
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

      const captureChangeLogDiff =
        <T>(changeLogPath: string): OperatorFunction<T, string> =>
        (source) => {
          return readFileIfExists(changeLogPath, changelogHeader).pipe(
            combineLatestWith(source),
            concatMap(async ([input]) => {
              const output = await lastValueFrom(
                readFileIfExists(changeLogPath, changelogHeader)
              );

              return diff(input, output);
            })
          );
        };

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


      const changeLogPath = getChangelogPath(projectRoot);
      return runStandardVersion$.pipe(
        captureChangeLogDiff(changeLogPath),
        concatMap((notes) =>
          concat(
            ...(push && dryRun === false ? [pushToGitRemote$] : []),
            ...(dryRun === false
              ? [
                  executePostTargets({
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
                      notes,
                    },
                    context,
                  }),
                ]
              : [])
          )
        ),
        reduce((result) => result, { success: true } as const)
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
    push: options.push as boolean,
    remote: options.remote as string,
    dryRun: options.dryRun as boolean,
    trackDeps: options.trackDeps as boolean,
    baseBranch: options.baseBranch as string,
    noVerify: options.noVerify as boolean,
    syncVersions: options.syncVersions as boolean,
    skipRootChangelog: options.skipRootChangelog as boolean,
    skipProjectChangelog: options.skipProjectChangelog as boolean,
    version: options.version,
    releaseAs: options.releaseAs,
    preid: options.preid,
    changelogHeader: options.changelogHeader,
    versionTagPrefix: options.versionTagPrefix,
    postTargets: options.postTargets,
    commitMessageFormat: options.commitMessageFormat,
  };
}
