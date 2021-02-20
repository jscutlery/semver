import { BuilderContext, targetFromTargetString } from '@angular-devkit/architect';
import { resolve } from 'path';
import { defer, Observable } from 'rxjs';
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

export function getProjectRoot(context: BuilderContext): Observable<string> {
  return defer(
    async () => await context.getProjectMetadata(context.target.project)
  ).pipe(map(({ root }) => root as string));
}

export function getOutputPath(context: BuilderContext): Observable<string> {
  return defer(async () => {
    let targetOptions: Record<string, string>;

    try {
      targetOptions = (await context.getTargetOptions(
        targetFromTargetString(`${context.target.project}:build`)
      )) as Record<string, string>;
    } catch (error) {
      throw new Error(
        `Could not find target: ${context.target.project}:build`
      );
    }

    const outputPath = targetOptions.outputPath;

    if (outputPath == null) {
      throw new Error(
        `Could not find 'outputPath' option for target: ${context.target.project}:build`
      );
    }

    return resolve(context.workspaceRoot, outputPath);
  });
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

export function _getWorkspaceDefinition(
  workspaceRoot: string
): Observable<WorkspaceDefinition> {
  return readJsonFile(resolve(workspaceRoot, 'workspace.json')).pipe(
    catchError(() => readJsonFile(resolve(workspaceRoot, 'angular.json')))
  );
}
