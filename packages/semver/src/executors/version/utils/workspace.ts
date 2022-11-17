import type {
  ExecutorContext,
  NxJsonConfiguration,
  ProjectsConfigurations,
} from '@nrwl/devkit';
import { resolve } from 'path';

/* istanbul ignore next */
export function getProjectRoot(context: ExecutorContext): string {
  return context.workspace.projects[context.projectName as string].root;
}

/* istanbul ignore next */
export function getProjectRoots(
  workspaceRoot: string,
  workspace: ProjectsConfigurations & NxJsonConfiguration<string[] | '*'>
): string[] {
  return Object.values(workspace.projects).map((project) =>
    typeof project === 'string'
      ? resolve(workspaceRoot, project)
      : resolve(workspaceRoot, project.root)
  );
}
