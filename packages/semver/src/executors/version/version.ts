import { ProjectsConfigurations } from '@nx/devkit';
import { forkJoin, Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
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
  changelogHeader: string;
  skipCommit: boolean;
  commitMessage: string;
  projectName: string;
  skipProjectChangelog: boolean;
  dependencyUpdates: Version[];
  preset: PresetOpt;
  workspace: ProjectsConfigurations | undefined;
}

export function versionWorkspace({
  skipRootChangelog,
  commitMessage,
  newVersion,
  dryRun,
  noVerify,
  projectName,
  tag,
  skipCommit,
  projectRoot,
  ...options
}: {
  skipRootChangelog: boolean;
  projectRoot: string;
} & CommonVersionOptions) {
  const projectRoots = getProjectRoots(
    options.workspaceRoot,
    options.workspace,
  );
  return forkJoin([
    _generateChangelogs({
      projectRoots,
      skipRootChangelog,
      commitMessage,
      newVersion,
      dryRun,
      noVerify,
      projectName,
      skipCommit,
      tag,
      ...options,
    }),

    forkJoin(
      projectRoots.map((projectRoot) =>
        updatePackageJson({
          projectRoot,
          newVersion,
          projectName,
          dryRun,
        }),
      ),
    ).pipe(map((paths) => paths.filter(isNotNull))),
  ]).pipe(
    map((paths) => paths.flat()),
    concatMap((paths) =>
      addToStage({
        paths,
        dryRun,
      }),
    ),
    concatMap(() =>
      commit({
        skipCommit,
        dryRun,
        noVerify,
        commitMessage,
        projectName,
      }),
    ),
    concatMap(() => getLastCommitHash({ projectRoot })),
    concatMap((commitHash) =>
      createTag({
        dryRun,
        tag,
        commitHash,
        commitMessage,
        projectName,
      }),
    ),
  );
}

export function versionProject({
  workspaceRoot,
  projectRoot,
  newVersion,
  dryRun,
  commitMessage,
  noVerify,
  tagPrefix,
  projectName,
  skipCommit,
  tag,
  ...options
}: {
  projectRoot: string;
} & CommonVersionOptions) {
  return _generateChangelogs({
    projectName,
    projectRoots: [projectRoot],
    skipRootChangelog: true,
    workspaceRoot,
    newVersion,
    commitMessage,
    dryRun,
    skipCommit,
    noVerify,
    tagPrefix,
    tag,
    ...options,
  }).pipe(
    concatMap((changelogPaths) =>
      /* If --skipProjectChangelog is passed `changelogPaths` has length 0, otherwise it has 1 single entry. */
      changelogPaths.length === 1
        ? insertChangelogDependencyUpdates({
            changelogPath: changelogPaths[0],
            version: newVersion,
            dryRun,
            dependencyUpdates: options.dependencyUpdates,
          }).pipe(
            concatMap((changelogPath) =>
              addToStage({ paths: [changelogPath], dryRun }),
            ),
          )
        : of(undefined),
    ),
    concatMap(() =>
      updatePackageJson({
        newVersion,
        projectRoot,
        projectName,
        dryRun,
      }).pipe(
        concatMap((packageFile) =>
          packageFile !== null
            ? addToStage({
                paths: [packageFile],
                dryRun,
              })
            : of(undefined),
        ),
      ),
    ),
    concatMap(() =>
      commit({
        skipCommit,
        dryRun,
        noVerify,
        commitMessage,
        projectName,
      }),
    ),
    concatMap(() => getLastCommitHash({ projectRoot })),
    concatMap((commitHash) =>
      createTag({
        dryRun,
        tag,
        commitHash,
        commitMessage,
        projectName,
      }),
    ),
  );
}

/* istanbul ignore next */
export function _generateChangelogs({
  projectRoots,
  workspaceRoot,
  skipRootChangelog,
  skipProjectChangelog,
  projectName,
  ...options
}: CommonVersionOptions & {
  skipRootChangelog: boolean;
  projectRoots: string[];
}): Observable<string[]> {
  const changelogRoots = projectRoots
    .filter(
      (projectRoot) => !(skipProjectChangelog && projectRoot !== workspaceRoot),
    )
    .filter(
      (projectRoot) => !(skipRootChangelog && projectRoot === workspaceRoot),
    );

  if (changelogRoots.length === 0) {
    return of([]);
  }

  return forkJoin(
    changelogRoots.map((projectRoot) =>
      updateChangelog({
        projectRoot,
        ...options,
      }).pipe(
        logStep({
          step: 'changelog_success',
          message: `Generated CHANGELOG.md.`,
          projectName,
        }),
      ),
    ),
  );
}

function isNotNull(path: string | null): path is string {
  return path !== null;
}
