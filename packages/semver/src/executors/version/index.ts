import { logger } from '@nrwl/devkit';
import { SchemaError } from '@nrwl/tao/src/shared/params';
import { concat, defer, lastValueFrom, of } from 'rxjs';
import { catchError, mapTo, switchMap } from 'rxjs/operators';

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
    releaseCommitMessageFormat
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
        return of(undefined);
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
        releaseCommitMessageFormat
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

  return lastValueFrom(
    action$.pipe(
      mapTo({ success: true }),
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
    releaseCommitMessageFormat: options.releaseCommitMessageFormat
  };
}
