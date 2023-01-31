import type {
  ExecutorContext,
  ProjectConfiguration,
  ProjectsConfigurations,
} from '@nrwl/devkit';
import { resolve } from 'path';

/* istanbul ignore next */
export function getProject(context: ExecutorContext): ProjectConfiguration {
  const project =
    context.projectsConfigurations?.projects[context.projectName as string];

  if (!project) {
    throw new Error(`Project root not found for ${context.projectName}`);
  }

  return project;
}

/* istanbul ignore next */
export function getProjectRoots(
  workspaceRoot: string,
  workspace: ProjectsConfigurations | undefined
): string[] {
  const projects = Object.values(workspace?.projects ?? {});

  if (projects.length === 0) {
    throw new Error('No projects found in workspace');
  }

  return projects.map((project) =>
    typeof project === 'string'
      ? resolve(workspaceRoot, project)
      : resolve(workspaceRoot, project.root)
  );
}
