import type { ExecutorContext, WorkspaceJsonConfiguration } from '@nrwl/devkit';
import { resolve } from 'path';
import type { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { readJsonFile } from './filesystem';

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

export function _getWorkspaceDefinition(
  workspaceRoot: string
): Observable<WorkspaceJsonConfiguration> {
  return readJsonFile(resolve(workspaceRoot, 'workspace.json')).pipe(
    catchError(() => readJsonFile(resolve(workspaceRoot, 'angular.json')))
  );
}
