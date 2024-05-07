import { type ExecutorContext } from '@nx/devkit';
import { concat, defer, lastValueFrom, of } from 'rxjs';
import { catchError, concatMap, reduce, switchMap } from 'rxjs/operators';
import type { PresetOpt, VersionBuilderSchema } from './schema';
import {
  calculateChangelogChanges,
  defaultHeader,
  getChangelogPath,
} from './utils/changelog';
import { formatCommitMessage } from './utils/commit';
import {
  getDependencyRoots,
  type DependencyRoot,
} from './utils/get-project-dependencies';
import { tryPush } from './utils/git';
import { _logStep } from './utils/logger';
import { runPostTargets } from './utils/post-target';
import { formatTag, formatTagPrefix } from './utils/tag';
import { tryBump } from './utils/try-bump';
import { getProject } from './utils/workspace';
import {
  versionProject,
  versionWorkspace,
  type CommonVersionOptions,
} from './version';

export default async function version(
  options: VersionBuilderSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  const {
    allowEmptyRelease,
    baseBranch,
    changelogHeader,
    commitMessageFormat,
    commitParserOptions,
    dryRun,
    noVerify,
    postTargets,
    preid,
    preset,
    push,
    releaseAs,
    remote,
    skipCommit,
    skipCommitTypes,
    skipProjectChangelog,
    skipRootChangelog,
    syncVersions,
    trackDeps,
    versionTagPrefix,
  } = _normalizeOptions(options);

  const workspaceRoot = context.root;
  const projectName = context.projectName as string;

  let dependencyRoots: DependencyRoot[] = [];
  try {
    dependencyRoots = await getDependencyRoots({
      projectName,
      releaseAs,
      trackDeps,
      context,
    });
  } catch (e) {
    _logStep({
      step: 'failure',
      level: 'error',
      message: `Failed to determine dependencies.
      Please report an issue: https://github.com/jscutlery/semver/issues/new.`,
      projectName,
    });
    return { success: false };
  }

  const tagPrefix = formatTagPrefix({
    versionTagPrefix,
    projectName,
    syncVersions,
  });
  const projectRoot = getProject(context).root;
  const newVersion$ = tryBump({
    commitParserOptions,
    preset,
    projectRoot,
    dependencyRoots,
    tagPrefix,
    versionTagPrefix,
    releaseType: releaseAs,
    preid,
    syncVersions,
    allowEmptyRelease,
    skipCommitTypes,
    projectName,
  });

  const runSemver$ = newVersion$.pipe(
    switchMap((newVersion) => {
      if (newVersion == null) {
        _logStep({
          step: 'nothing_changed',
          level: 'info',
          message: 'Nothing changed since last release.',
          projectName,
        });
        return of({ success: true });
      }

      _logStep({
        step: 'calculate_version_success',
        message: `Calculated new version "${newVersion.version}".`,
        projectName,
      });

      const { version, dependencyUpdates } = newVersion;
      const tag = formatTag({ tagPrefix, version });
      const commitMessage = formatCommitMessage({
        projectName,
        commitMessageFormat,
        version,
      });

      const options: CommonVersionOptions = {
        newVersion: version,
        tag,
        dryRun,
        trackDeps,
        noVerify,
        preset,
        tagPrefix,
        changelogHeader,
        workspaceRoot,
        projectName,
        skipProjectChangelog,
        commitMessage,
        dependencyUpdates,
        skipCommit,
        workspace: context.projectsConfigurations,
      };

      const version$ = defer(() =>
        syncVersions
          ? versionWorkspace({
              ...options,
              projectRoot,
              skipRootChangelog,
            })
          : versionProject({
              ...options,
              projectRoot,
            }),
      );

      const push$ = defer(() =>
        tryPush({
          tag,
          branch: baseBranch,
          noVerify,
          remote,
          projectName,
        }),
      );

      const _runPostTargets = ({ notes }: { notes: string }) =>
        defer(() =>
          runPostTargets({
            context,
            projectName,
            postTargets,
            templateStringContext: {
              dryRun,
              notes,
              version,
              projectName,
              tag,
              previousTag: formatTag({
                tagPrefix,
                version: newVersion.previousVersion,
              }),
            },
          }),
        );

      const changelogPath = getChangelogPath(
        syncVersions ? workspaceRoot : projectRoot,
      );

      return version$.pipe(
        calculateChangelogChanges({
          changelogHeader,
          changelogPath,
        }),
        concatMap((notes) =>
          concat(
            ...(push && dryRun === false ? [push$] : []),
            ...(dryRun === false ? [_runPostTargets({ notes })] : []),
          ),
        ),
        reduce((result) => result, { success: true }),
      );
    }),
  );

  return lastValueFrom(
    runSemver$.pipe(
      catchError((error) => {
        _logStep({
          step: 'failure',
          level: 'error',
          message: _toErrorMessage(error),
          projectName,
        });
        return of({ success: false });
      }),
    ),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _toErrorMessage(error: any): string {
  return error.stack ?? error.message ?? error.toString();
}

function _normalizeOptions(options: VersionBuilderSchema) {
  return {
    ...options,
    allowEmptyRelease: options.allowEmptyRelease as boolean,
    baseBranch: options.baseBranch as string,
    changelogHeader: options.changelogHeader ?? defaultHeader,
    commitMessageFormat: options.commitMessageFormat as string,
    commitParserOptions: options.commitParserOptions,
    dryRun: options.dryRun as boolean,
    noVerify: options.noVerify as boolean,
    push: options.push as boolean,
    releaseAs: options.releaseAs,
    remote: options.remote as string,
    skipCommit: options.skipCommit as boolean,
    skipCommitTypes: options.skipCommitTypes as string[],
    skipProjectChangelog: options.skipProjectChangelog as boolean,
    skipRootChangelog: options.skipRootChangelog as boolean,
    syncVersions: options.syncVersions as boolean,
    trackDeps: options.trackDeps as boolean,
    versionTagPrefix: options.tagPrefix,
    preset: (options.preset === 'conventional'
      ? 'conventionalcommits'
      : options.preset || 'angular') as PresetOpt,
  };
}
