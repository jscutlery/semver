import { ExecutorContext } from '@nrwl/devkit';
import { resolve } from 'path';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { readJsonFile } from './filesystem';

export interface WorkspaceDefinition {
  projects: {
    [key: string]: {
      root: string;
    };
  };
}

export function getPackageFiles(workspaceRoot: string): Observable<string[]> {
  return getProjectRoots(workspaceRoot).pipe(
    map((projectRoots) =>
      projectRoots.map((projectRoot) => resolve(projectRoot, 'package.json'))
    )
  );
}

export function getProjectRoot(context: ExecutorContext): string {
  return context.workspace.projects[context.projectName].root;
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

export function _getWorkspaceDefinition(
  workspaceRoot: string
): Observable<WorkspaceDefinition> {
  return readJsonFile(resolve(workspaceRoot, 'workspace.json')).pipe(
    catchError(() => readJsonFile(resolve(workspaceRoot, 'angular.json')))
  );
}
