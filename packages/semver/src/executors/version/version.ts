import { ProjectsConfigurations } from '@nx/devkit';
import type { Options as CommitParserOptions } from 'conventional-commits-parser';
import { PresetOpt } from './schema';
import {
  insertChangelogDependencyUpdates,
  updateChangelog,
} from './utils/changelog';
import { commit } from './utils/commit';
import { addToStage, createTag, getLastCommitHash } from './utils/git';
import { logStep } from './utils/logger';
import { updatePackageJson } from './utils/project';
import { getProjectRoots } from './utils/workspace';

export type Version =
  | {
      type: 'project';
      version: string | null;
    }
  | {
      type: 'dependency';
      version: string | null;
      dependencyName: string;
    };

export interface CommonVersionOptions {
  tag: string;
  dryRun: boolean;
  trackDeps: boolean;
  newVersion: string;
  noVerify: boolean;
  workspaceRoot: string;
  tagPrefix: string;
  tagSign: boolean;
  changelogHeader: string;
  skipCommit: boolean;
  skipStage: boolean;
  commitMessage: string;
  projectName: string;
  skipProjectChangelog: boolean;
  dependencyUpdates: Version[];
  preset: PresetOpt;
  workspace: ProjectsConfigurations | undefined;
  commitParserOptions?: CommitParserOptions;
}

export async function versionWorkspace({
  skipRootChangelog,
  commitMessage,
  newVersion,
  dryRun,
  noVerify,
  tagSign,
  projectName,
  tag,
  skipCommit,
  skipStage,
  projectRoot,
  ...options
}: {
  skipRootChangelog: boolean;
  projectRoot: string;
} & CommonVersionOptions): Promise<string | undefined> {
  const projectRoots = getProjectRoots(
    options.workspaceRoot,
    options.workspace,
  );

  const [changelogPaths, packageJsonPaths] = await Promise.all([
    _generateChangelogs({
      projectRoots,
      skipRootChangelog,
      commitMessage,
      newVersion,
      dryRun,
      noVerify,
      tagSign,
      projectName,
      skipCommit,
      skipStage,
      tag,
      ...options,
    }),

    Promise.all(
      projectRoots.map((projectRoot) =>
        updatePackageJson({
          projectRoot,
          newVersion,
          projectName,
          dryRun,
        }),
      ),
    ).then((paths) => paths.filter(isNotNull)),
  ]);

  const paths = [...changelogPaths, ...packageJsonPaths];

  await addToStage({
    paths,
    dryRun,
    skipStage,
  });

  await commit({
    skipCommit,
    dryRun,
    noVerify,
    commitMessage,
    projectName,
  });

  const commitHash = await getLastCommitHash({ projectRoot });

  return createTag({
    dryRun,
    tag,
    commitHash,
    commitMessage,
    projectName,
    tagSign,
  });
}

export async function versionProject({
  workspaceRoot,
  projectRoot,
  newVersion,
  dryRun,
  commitMessage,
  noVerify,
  tagPrefix,
  tagSign,
  projectName,
  skipCommit,
  skipStage,
  tag,
  ...options
}: {
  projectRoot: string;
} & CommonVersionOptions): Promise<string | undefined> {
  const changelogPaths = await _generateChangelogs({
    projectName,
    projectRoots: [projectRoot],
    skipRootChangelog: true,
    workspaceRoot,
    newVersion,
    commitMessage,
    dryRun,
    skipCommit,
    skipStage,
    noVerify,
    tagPrefix,
    tag,
    tagSign,
    ...options,
  });

  /* If --skipProjectChangelog is passed `changelogPaths` has length 0, otherwise it has 1 single entry. */
  if (changelogPaths.length === 1) {
    const changelogPath = await insertChangelogDependencyUpdates({
      changelogPath: changelogPaths[0],
      version: newVersion,
      dryRun,
      dependencyUpdates: options.dependencyUpdates,
    });

    await addToStage({ paths: [changelogPath], dryRun, skipStage });
  }

  const packageFile = await updatePackageJson({
    newVersion,
    projectRoot,
    projectName,
    dryRun,
  });

  if (packageFile !== null) {
    await addToStage({
      paths: [packageFile],
      dryRun,
      skipStage,
    });
  }

  await commit({
    skipCommit,
    dryRun,
    noVerify,
    commitMessage,
    projectName,
  });

  const commitHash = await getLastCommitHash({ projectRoot });

  return createTag({
    dryRun,
    tag,
    commitHash,
    commitMessage,
    projectName,
    tagSign,
  });
}

/* istanbul ignore next */
export async function _generateChangelogs({
  projectRoots,
  workspaceRoot,
  skipRootChangelog,
  skipProjectChangelog,
  projectName,
  ...options
}: CommonVersionOptions & {
  skipRootChangelog: boolean;
  projectRoots: string[];
}): Promise<string[]> {
  const changelogRoots = projectRoots
    .filter(
      (projectRoot) => !(skipProjectChangelog && projectRoot !== workspaceRoot),
    )
    .filter(
      (projectRoot) => !(skipRootChangelog && projectRoot === workspaceRoot),
    );

  if (changelogRoots.length === 0) {
    return [];
  }

  return Promise.all(
    changelogRoots.map((projectRoot) =>
      updateChangelog({
        projectRoot,
        ...options,
      }).then((changelogPath) => {
        logStep({
          step: 'changelog_success',
          message: `Generated CHANGELOG.md.`,
          projectName,
        });
        return changelogPath;
      }),
    ),
  );
}

function isNotNull(path: string | null): path is string {
  return path !== null;
}
