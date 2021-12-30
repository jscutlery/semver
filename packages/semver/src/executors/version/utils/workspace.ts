import { resolve } from 'path';
import { catchError, map } from 'rxjs/operators';

import { readJsonFile } from './filesystem';

import type { Observable } from 'rxjs';
import type { ExecutorContext, WorkspaceJsonConfiguration } from '@nrwl/devkit';

export function getPackageFiles(workspaceRoot: string): Observable<string[]> {
  return getProjectRoots(workspaceRoot).pipe(
    map((projectRoots) =>
      projectRoots.map((projectRoot) => resolve(projectRoot, 'package.json'))
    )
  );
}

export function getProjectRoot(context: ExecutorContext): string {
  return context.workspace.projects[context.projectName as string].root;
}

export function getProjectRoots(workspaceRoot: string): Observable<string[]> {
  return _getWorkspaceDefinition(workspaceRoot).pipe(
    map((workspaceDefinition) =>
      Object.values(workspaceDefinition.projects).map((project) =>
        typeof project === 'string'
          ? resolve(workspaceRoot, project)
          : resolve(workspaceRoot, project.root)
      )
    )
  );
}

export function getProjectNameFromPath(
  context: ExecutorContext,
  path: string
): string {
  return Object.entries(context.workspace.projects).filter(
    ([, v]) => v.root === path
  )?.[0]?.[0];
}

export function _getWorkspaceDefinition(
  workspaceRoot: string
): Observable<WorkspaceJsonConfiguration> {
  return readJsonFile(resolve(workspaceRoot, 'workspace.json')).pipe(
    catchError(() => readJsonFile(resolve(workspaceRoot, 'angular.json')))
  );
}
