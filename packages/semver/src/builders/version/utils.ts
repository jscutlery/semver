import { BuilderContext } from '@angular-devkit/architect';
import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { defer, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as standardVersionDefaults from 'standard-version/defaults';
import * as changelog from 'standard-version/lib/lifecycles/changelog';
import { promisify } from 'util';
import { defaultHeader } from './utils/changelog';
import { readJsonFile } from './utils/filesystem';

export interface WorkspaceDefinition {
  projects: {
    [key: string]: {
      root: string;
    };
  };
}

export function getProjectRoot(context: BuilderContext): Observable<string> {
  return defer(
    async () => await context.getProjectMetadata(context.target.project)
  ).pipe(map(({ root }) => root as string));
}

export function getChangelogPath(projectRoot: string) {
  return resolve(projectRoot, 'CHANGELOG.md');
}

export function hasChangelog(projectRoot: string) {
  return existsSync(getChangelogPath(projectRoot));
}

export function getProjectRoots(workspaceRoot: string): Observable<string[]> {
  return _getWorkspaceDefinition(workspaceRoot).pipe(
    map((workspaceDefinition) =>
      Object.values(workspaceDefinition.projects).map((project) =>
        resolve(workspaceRoot, project.root)
      )
    )
  );
}

export function getPackageFiles(workspaceRoot: string): Observable<string[]> {
  return getProjectRoots(workspaceRoot).pipe(
    map((projectRoots) =>
      projectRoots.map((projectRoot) => resolve(projectRoot, 'package.json'))
    )
  );
}

export function _getWorkspaceDefinition(
  workspaceRoot: string
): Observable<WorkspaceDefinition> {
  return readJsonFile(resolve(workspaceRoot, 'workspace.json')).pipe(
    catchError(() => readJsonFile(resolve(workspaceRoot, 'angular.json')))
  );
}

export function updateChangelog({
  projectRoot,
  dryRun,
  preset,
  newVersion,
}: {
  projectRoot: string;
  dryRun: boolean;
  preset: string;
  newVersion: string;
}) {
  return defer(async () => {
    const changelogPath = resolve(projectRoot, 'CHANGELOG.md');
    await changelog(
      {
        ...standardVersionDefaults,
        header: defaultHeader,
        path: projectRoot,
        preset,
        dryRun,
        infile: changelogPath,
      },
      newVersion
    );
    if (!dryRun) {
      await promisify(execFile)('git', ['add', changelogPath]);
    }
  });
}
