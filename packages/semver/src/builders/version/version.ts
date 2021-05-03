import { resolve } from 'path';
import * as standardVersion from 'standard-version';

import { SemverOptions } from './schema';
import { defaultHeader, getChangelogPath, updateChangelog } from './utils/changelog';
import { addToStage, tryPushToGitRemote } from './utils/git';
import { tryBump } from './utils/try-bump';
import { getPackageFiles, getProjectsRoot } from './utils/workspace';

export interface CommonVersionOptions {
  dryRun: boolean;
  newVersion: string;
  noVerify: boolean;
  preset: string;
  tagPrefix: string;
  changelogHeader?: string;
}

export type SemverContext = SemverOptions & {
  workspaceRoot: string;
  logger: Logger;
};

export interface Logger {
  warn(message: string): void;
  info(message: string): void;
}

export async function runSemver({
  push,
  remote,
  dryRun,
  baseBranch,
  noVerify,
  skipRootChangelog,
  skipProjectChangelog,
  version,
  preid,
  changelogHeader,
  configs,
  workspaceRoot,
  logger,
}: SemverContext): Promise<void> {
  const preset = 'angular';

  for (const config of configs) {
    const tagPrefix = `${config.name}-`;
    const newVersion = await tryBump({
      preset,
      projectRoot: config.path,
      tagPrefix,
      releaseType: version,
      preid,
      logger,
    });

    if (newVersion == null) {
      logger.info('⏹ Nothing changed since last release.');
      continue;
    }

    const options: CommonVersionOptions = {
      dryRun,
      newVersion,
      noVerify,
      preset,
      tagPrefix,
      changelogHeader,
    };

    if (config.type === 'sync-group') {
      await versionGroup({
        ...options,
        workspaceRoot,
        groupRoot: resolve(workspaceRoot, config.path),
        projectsRoot: getProjectsRoot({ workspaceRoot, config }),
        skipRootChangelog,
        skipProjectChangelog,
      });
    } else if (config.type === 'independent') {
      await versionProject({
        ...options,
        projectRoot: resolve(workspaceRoot, config.path),
      });
    }

    if (push && dryRun === false) {
      await tryPushToGitRemote({
        branch: baseBranch,
        noVerify,
        remote,
      }).toPromise();
    }
  }
}

/**
 * @internal
 */
export async function versionGroup({
  skipRootChangelog,
  projectsRoot,
  workspaceRoot,
  groupRoot,
  ...options
}: {
  skipRootChangelog: boolean;
  skipProjectChangelog: boolean;
  projectsRoot: string[];
  groupRoot: string;
  workspaceRoot: string;
} & CommonVersionOptions) {
  const changelogsPath = await generateProjectsChangelog({
    workspaceRoot,
    projectsRoot,
    ...options,
  });

  await addToStage({
    paths: changelogsPath,
    dryRun: options.dryRun,
  }).toPromise();

  return runStandardVersion({
    path: groupRoot,
    changelogPath: getChangelogPath(workspaceRoot),
    bumpFiles: getPackageFiles(projectsRoot),
    skipChangelog: skipRootChangelog,
    ...options,
  });
}

/**
 *  @internal
 */
export function versionProject({
  projectRoot,
  ...options
}: CommonVersionOptions & { projectRoot: string }): Promise<void> {
  return runStandardVersion({
    path: projectRoot,
    changelogPath: getChangelogPath(projectRoot),
    bumpFiles: [resolve(projectRoot, 'package.json')],
    skipChangelog: false,
    ...options,
  });
}

/**
 * Generate project's changelogs in parallel and return an array containing their path.
 * Skip generation if skipProjectChangelog passed and return an empty array.
 * @internal
 */
export function generateProjectsChangelog({
  projectsRoot,
  workspaceRoot,
  ...options
}: CommonVersionOptions & {
  skipProjectChangelog: boolean;
  projectsRoot: string[];
  workspaceRoot: string;
}): Promise<string[]> {
  if (options.skipProjectChangelog) {
    return Promise.resolve([]);
  }

  return Promise.all(
    projectsRoot.map((projectRoot) =>
      updateChangelog({
        dryRun: options.dryRun,
        preset: options.preset,
        projectRoot: resolve(workspaceRoot, projectRoot),
        newVersion: options.newVersion,
      })
    )
  );
}

export function runStandardVersion({
  bumpFiles,
  dryRun,
  path,
  changelogPath,
  newVersion,
  noVerify,
  preset,
  tagPrefix,
  skipChangelog,
  changelogHeader = defaultHeader,
}: {
  bumpFiles: string[];
  skipChangelog: boolean;
  path: string;
  changelogPath: string;
} & CommonVersionOptions) {
  return standardVersion({
    bumpFiles,
    /* Make sure that we commit the manually generated changelogs that
     * we staged. */
    commitAll: true,
    dryRun,
    header: changelogHeader,
    infile: changelogPath,
    /* Control version to avoid different results between the value
     * returned by `tryBump` and the one computed by standard-version. */
    releaseAs: newVersion,
    silent: false,
    noVerify,
    packageFiles: bumpFiles,
    path,
    preset,
    tagPrefix,
    skip: {
      changelog: skipChangelog,
    },
  });
}
