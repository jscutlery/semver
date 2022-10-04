import type {
  ExecutorContext,
  NxJsonConfiguration,
  ProjectsConfigurations,
} from '@nrwl/devkit';
import { resolve } from 'path';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { readJsonFile } from './filesystem';

/* istanbul ignore next */
export function getProjectRoot(context: ExecutorContext): string {
  return context.workspace.projects[context.projectName as string].root;
}

/* istanbul ignore next */
export function getProjectRoots(
  workspace: ProjectsConfigurations & NxJsonConfiguration<string[] | '*'>,
  workspaceRoot: string
): Observable<string[]> {
  return _getWorkspaceDefinition(workspaceRoot).pipe(
    map((workspaceDefinition) =>
      workspaceDefinition
        ? Object.values(workspaceDefinition.projects).map((project) =>
            typeof project === 'string'
              ? resolve(workspaceRoot, project)
              : resolve(workspaceRoot, project.root)
          )
        : Object.values(workspace.projects).map((project) =>
            typeof project === 'string'
              ? resolve(workspaceRoot, project)
              : resolve(workspaceRoot, project.root)
          )
    )
  );
}

/* istanbul ignore next */
function _getWorkspaceDefinition(
  workspaceRoot: string
): Observable<ProjectsConfigurations | null> {
  return readJsonFile(resolve(workspaceRoot, 'workspace.json')).pipe(
    catchError(() => readJsonFile(resolve(workspaceRoot, 'angular.json'))),
    catchError(() => of(null))
  );
}
