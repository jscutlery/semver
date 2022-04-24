import { logger, type ExecutorContext } from '@nrwl/devkit';
import { concat, defer, lastValueFrom, of } from 'rxjs';
import { catchError, concatMap, reduce, switchMap } from 'rxjs/operators';
import type { VersionBuilderSchema } from './schema';
import {
  calculateChangelogChanges,
  defaultHeader,
  getChangelogPath
} from './utils/changelog';
import {
  getDependencyRoots,
  type DependencyRoot
} from './utils/get-project-dependencies';
import { DEFAULT_COMMIT_MESSAGE_FORMAT, tryPush } from './utils/git';
import { runPostTargets } from './utils/post-target';
import { resolveInterpolation } from './utils/resolve-interpolation';
import { formatTag, formatTagPrefix } from './utils/tag';
import { tryBump } from './utils/try-bump';
import { getProjectRoot } from './utils/workspace';
import {
  versionProject,
  versionWorkspace,
  type CommonVersionOptions,
  type StandardVersionPreset
} from './version';

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
    preset,
    allowEmptyRelease,
  } = normalizeOptions(options);
  const workspaceRoot = context.root;
  const projectName = context.projectName as string;

  const tagPrefix = formatTagPrefix({
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
    syncVersions,
    allowEmptyRelease,
  });

  /**
   * 1. Calculate new version
   * 2. Release [ create changelog -> add to stage -> commit -> tag ]
   * 3. Push to Git
   * 4. Run post targets
   */
  const runSemver$ = newVersion$.pipe(
    switchMap((newVersion) => {
      if (newVersion == null) {
        logger.info('⏹ Nothing changed since last release.');
        return of({ success: true });
      }

      const commitMessage = resolveInterpolation(commitMessageFormat, {
        projectName,
        version: newVersion.version,
      }) as string;

      const options: CommonVersionOptions = {
        dryRun,
        trackDeps,
        noVerify,
        preset,
        projectRoot,
        tagPrefix,
        changelogHeader,
        workspaceRoot,
        projectName,
        skipProjectChangelog,
        commitMessage,
        newVersion: newVersion.version,
        dependencyUpdates: newVersion.dependencyUpdates,
      };

      const version$ = defer(() =>
        syncVersions
          ? versionWorkspace({
              ...options,
              skipRootChangelog,
            })
          : versionProject(options)
      );

      const push$ = defer(() =>
        tryPush({
          branch: baseBranch,
          noVerify,
          remote,
        })
      );

      const changelogPath = getChangelogPath(
        syncVersions ? workspaceRoot : projectRoot
      );

      return version$.pipe(
        calculateChangelogChanges({
          changelogHeader,
          changelogPath,
        }),
        concatMap((notes) =>
          concat(
            ...(push && dryRun === false ? [push$] : []),
            ...(dryRun === false
              ? [
                  runPostTargets({
                    postTargets,
                    options: {
                      project: projectName,
                      version: newVersion.version,
                      tag: formatTag({
                        tagPrefix,
                        version: newVersion.version,
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
    runSemver$.pipe(
      catchError((error) => {
        if (error?.name === 'SchemaError') {
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
    versionTagPrefix: options.tagPrefix ?? options.versionTagPrefix,
    commitMessageFormat:
      options.commitMessageFormat ?? DEFAULT_COMMIT_MESSAGE_FORMAT,
    preset:
      options.preset === 'angular'
        ? 'angular'
        : ('conventionalcommits' as StandardVersionPreset),
  };
}
