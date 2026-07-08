import { type ExecutorContext } from '@nx/devkit';
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
import { logStep } from './utils/logger';
import { verifyNpmAuth } from './utils/npm';
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
    push,
    enforceAtomicPush,
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
    trackDepsWithReleaseAs,
    versionTagPrefix,
    tagSign,
    postTargets,
    commitMessageFormat,
    preset,
    allowEmptyRelease,
    skipCommitTypes,
    skipCommit,
    skipStage,
    commitParserOptions,
    verifyNpmAuth: shouldVerifyNpmAuth,
  } = _normalizeOptions(options);

  const workspaceRoot = context.root;
  const projectName = context.projectName as string;

  if (shouldVerifyNpmAuth) {
    try {
      await verifyNpmAuth({ context, projectName });
    } catch (error) {
      logStep({
        step: 'failure',
        level: 'error',
        message: _toErrorMessage(error),
        projectName,
      });
      return { success: false };
    }
  }

  let dependencyRoots: DependencyRoot[] = [];
  try {
    dependencyRoots = await getDependencyRoots({
      context,
      projectName,
      releaseAs,
      trackDeps,
      trackDepsWithReleaseAs,
    });
  } catch (e) {
    logStep({
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

  try {
    const newVersion = await tryBump({
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
      workspace: context.projectsConfigurations,
    });

    if (newVersion == null) {
      logStep({
        step: 'nothing_changed',
        level: 'info',
        message: 'Nothing changed since last release.',
        projectName,
      });
      return { success: true };
    }

    logStep({
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
      tagSign,
      changelogHeader,
      workspaceRoot,
      projectName,
      skipProjectChangelog,
      commitMessage,
      dependencyUpdates,
      skipCommit,
      skipStage,
      commitParserOptions,
      workspace: context.projectsConfigurations,
    };

    const changelogPath = getChangelogPath(
      syncVersions ? workspaceRoot : projectRoot,
    );

    const { notes } = await calculateChangelogChanges({
      changelogHeader,
      changelogPath,
      run: () =>
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
    });

    if (push && dryRun === false) {
      await tryPush({
        tag,
        branch: baseBranch,
        noVerify,
        enforceAtomicPush,
        remote,
        projectName,
      });
    }

    if (dryRun === false) {
      await runPostTargets({
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
      });
    }

    return { success: true };
  } catch (error) {
    logStep({
      step: 'failure',
      level: 'error',
      message: _toErrorMessage(error),
      projectName,
    });
    return { success: false };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _toErrorMessage(error: any): string {
  return error.stack ?? error.message ?? error.toString();
}

function _normalizeOptions(options: VersionBuilderSchema) {
  return {
    ...options,
    push: options.push as boolean,
    verifyNpmAuth: options.verifyNpmAuth as boolean,
    enforceAtomicPush: options.enforceAtomicPush as boolean,
    remote: options.remote as string,
    dryRun: options.dryRun as boolean,
    trackDeps: options.trackDeps as boolean,
    baseBranch: options.baseBranch as string,
    noVerify: options.noVerify as boolean,
    syncVersions: options.syncVersions as boolean,
    skipRootChangelog: options.skipRootChangelog as boolean,
    skipProjectChangelog: options.skipProjectChangelog as boolean,
    allowEmptyRelease: options.allowEmptyRelease as boolean,
    skipCommitTypes: options.skipCommitTypes as string[],
    releaseAs: options.releaseAs,
    tagSign: options.tagSign as boolean,
    changelogHeader: options.changelogHeader ?? defaultHeader,
    versionTagPrefix: options.tagPrefix,
    commitMessageFormat: options.commitMessageFormat as string,
    commitParserOptions: options.commitParserOptions,
    skipCommit: options.skipCommit as boolean,
    skipStage: options.skipStage as boolean,
    trackDepsWithReleaseAs: !!options.trackDepsWithReleaseAs,
    preset: (options.preset === 'conventional'
      ? 'conventionalcommits'
      : options.preset || 'conventionalcommits') as PresetOpt,
  };
}
