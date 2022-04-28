import { concat, forkJoin, Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import {
  insertChangelogDependencyUpdates,
  updateChangelog
} from './utils/changelog';
import { addToStage, commit, createTag } from './utils/git';
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

export type StandardVersionPreset = 'angular' | 'conventionalcommits';

export interface CommonVersionOptions {
  tag: string;
  dryRun: boolean;
  trackDeps: boolean;
  newVersion: string;
  noVerify: boolean;
  workspaceRoot: string;
  tagPrefix: string;
  changelogHeader: string;
  commitMessage: string;
  projectName: string;
  skipProjectChangelog: boolean;
  dependencyUpdates: Version[];
  preset: StandardVersionPreset;
}

export function versionWorkspace({
  skipRootChangelog,
  commitMessage,
  newVersion,
  dryRun,
  noVerify,
  projectName,
  tag,
  ...options
}: {
  skipRootChangelog: boolean;
} & CommonVersionOptions) {
  return concat(
    getProjectRoots(options.workspaceRoot).pipe(
      concatMap((projectRoots) =>
        _generateChangelogs({
          projectRoots,
          skipRootChangelog,
          commitMessage,
          newVersion,
          dryRun,
          noVerify,
          projectName,
          tag,
          ...options,
        })
      ),
      concatMap((changelogPaths) =>
        addToStage({ paths: changelogPaths, dryRun })
      )
    ),
    getProjectRoots(options.workspaceRoot).pipe(
      concatMap((projectRoots) =>
        forkJoin(
          projectRoots.map((projectRoot) =>
            updatePackageJson({
              projectRoot,
              newVersion,
              projectName,
            })
          )
        )
      ),
      concatMap((packageFiles) =>
        concat(
          addToStage({
            paths: packageFiles.filter(
              (packageFile) => packageFile !== null
            ) as string[],
            dryRun,
          }),
          commit({
            dryRun,
            noVerify,
            commitMessage,
            projectName,
          }),
          createTag({
            dryRun,
            tag,
            commitMessage,
            projectName,
          })
        )
      )
    )
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
  tag,
  ...options
}: { projectRoot: string } & CommonVersionOptions) {
  return _generateChangelogs({
    projectName,
    projectRoots: [projectRoot],
    skipRootChangelog: true,
    workspaceRoot,
    newVersion,
    commitMessage,
    dryRun,
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
              addToStage({ paths: [changelogPath], dryRun })
            )
          )
        : of(undefined)
    ),
    concatMap(() =>
      concat(
        updatePackageJson({
          newVersion,
          projectRoot,
          projectName,
        }).pipe(
          concatMap((packageFile) =>
            packageFile !== null
              ? addToStage({
                  paths: [packageFile],
                  dryRun,
                })
              : of(undefined)
          )
        ),
        commit({
          dryRun,
          noVerify,
          commitMessage,
          projectName,
        }),
        createTag({
          dryRun,
          tag,
          commitMessage,
          projectName,
        })
      )
    )
  );
}

/**
 * istanbul ignore next
 */
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
      (projectRoot) => !(skipProjectChangelog && projectRoot !== workspaceRoot)
    )
    .filter(
      (projectRoot) => !(skipRootChangelog && projectRoot === workspaceRoot)
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
        })
      )
    )
  );
}
