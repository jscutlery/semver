import { concat, forkJoin, iif, Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import {
  insertChangelogDependencyUpdates,
  updateChangelog
} from './utils/changelog';
import { addToStage, commit, createTag } from './utils/git';
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
  dryRun: boolean;
  trackDeps: boolean;
  newVersion: string;
  noVerify: boolean;
  projectRoot: string;
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
          ...options,
        })
      ),
      concatMap((changelogPaths) =>
        addToStage({ paths: changelogPaths, dryRun: options.dryRun })
      )
    ),
    getProjectRoots(options.workspaceRoot).pipe(
      concatMap((projectRoots) =>
        forkJoin(
          projectRoots.map((projectRoot) =>
            updatePackageJson({
              projectRoot,
              newVersion: options.newVersion,
            })
          )
        )
      ),
      concatMap((packageFiles) =>
        addToStage({
          paths: packageFiles,
          dryRun: options.dryRun,
        })
      ),
      concatMap(() =>
        commit({
          dryRun: options.dryRun,
          noVerify: options.noVerify,
          commitMessage,
        })
      ),
      concatMap(() =>
        createTag({
          dryRun: options.dryRun,
          version: options.newVersion,
          commitMessage,
          tagPrefix: options.tagPrefix,
        })
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
  ...options
}: CommonVersionOptions) {
  return _generateChangelogs({
    projectRoots: [projectRoot],
    skipRootChangelog: true,
    workspaceRoot,
    newVersion,
    commitMessage,
    dryRun,
    ...options,
  }).pipe(
    concatMap((changelogPaths) =>
      iif(
        /* If --skipProjectChangelog is passed, changelogPaths has length 0,
           otherwise it has 1 single entry. */
        () => changelogPaths.length === 1,
        insertChangelogDependencyUpdates({
          changelogPath: changelogPaths[0],
          version: newVersion,
          dryRun,
          dependencyUpdates: options.dependencyUpdates,
        }).pipe(
          concatMap((changelogPath) =>
            addToStage({ paths: [changelogPath], dryRun })
          )
        ),
        of(null)
      )
    ),
    concatMap(() =>
      updatePackageJson({
        newVersion,
        projectRoot,
      })
    ),
    concatMap((packageFile) =>
      addToStage({
        paths: [packageFile],
        dryRun,
      })
    ),
    concatMap(() =>
      commit({
        dryRun,
        noVerify: options.noVerify,
        commitMessage,
      })
    ),
    concatMap(() =>
      createTag({
        dryRun,
        version: newVersion,
        tagPrefix: options.tagPrefix,
        commitMessage,
      })
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
  ...options
}: Omit<CommonVersionOptions, 'projectRoot'> & {
  skipRootChangelog: boolean;
  projectRoots: string[];
}): Observable<string[]> {
  const changelogFiles = projectRoots
    .filter(
      (projectRoot) => !(skipProjectChangelog && projectRoot !== workspaceRoot)
    )
    .filter(
      (projectRoot) => !(skipRootChangelog && projectRoot === workspaceRoot)
    );

  if (changelogFiles.length === 0) {
    return of([]);
  }

  return forkJoin(
    changelogFiles.map((projectRoot) =>
      updateChangelog({
        projectRoot,
        ...options,
      })
    )
  );
}
