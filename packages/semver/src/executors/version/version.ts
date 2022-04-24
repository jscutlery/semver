import { concat, forkJoin, iif, Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
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
  tagPrefix: string;
  workspaceRoot: string;
  changelogHeader?: string;
  commitMessageFormat?: string;
  projectName: string;
  skipProjectChangelog: boolean;
  dependencyUpdates: Version[];
  preset: StandardVersionPreset;
}

export function versionWorkspace({
  skipRootChangelog,
  ...options
}: {
  skipRootChangelog: boolean;
} & CommonVersionOptions) {
  return concat(
    getProjectRoots(options.workspaceRoot).pipe(
      concatMap((projectRoots) =>
        _generateProjectChangelogs({
          projectRoots,
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
      map((packageFiles) => packageFiles.filter(p => p !== null)),
      concatMap((packageFiles) =>
        addToStage({
          paths: packageFiles,
          dryRun: options.dryRun,
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
  ...options
}: CommonVersionOptions) {
  return _generateProjectChangelogs({
    ...options,
    workspaceRoot,
    projectRoots: [projectRoot],
    newVersion,
    dryRun,
    projectRoot,
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
        version: newVersion,
        noVerify: options.noVerify,
        projectName: options.projectName,
        commitMessageFormat: '',
      })
    ),
    concatMap(() =>
      createTag({
        dryRun,
        version: newVersion,
        commitMessage: '',
        tagPrefix: options.tagPrefix,
      })
    )
  );
}

/**
 * Generate project's changelogs and return an array containing their path.
 * Skip generation if --skip-project-changelog enabled and return an empty array.
 *
 * istanbul ignore next
 */
export function _generateProjectChangelogs({
  projectRoots,
  workspaceRoot,
  ...options
}: CommonVersionOptions & {
  skipProjectChangelog: boolean;
  projectRoots: string[];
  workspaceRoot: string;
}): Observable<string[]> {
  if (options.skipProjectChangelog) {
    return of([]);
  }

  return forkJoin(
    projectRoots
      /* Don't update the workspace's changelog as it will be
       * dealt with by `standardVersion`. */
      .filter((projectRoot) => projectRoot !== workspaceRoot)
      .map((projectRoot) =>
        updateChangelog({
          dryRun: options.dryRun,
          preset: options.preset,
          projectRoot,
          newVersion: options.newVersion,
          changelogHeader: options.changelogHeader,
          tagPrefix: options.tagPrefix,
        })
      )
  );
}
