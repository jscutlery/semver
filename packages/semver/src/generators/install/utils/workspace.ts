import type { Tree } from '@nrwl/devkit';
import { getProjects, updateProjectConfiguration } from '@nrwl/devkit';
import { ProjectConfiguration } from '@nrwl/tao/src/shared/workspace';

import { SchemaOptions } from '../schema';
import { createPrompt } from './prompt';

export type ProjectDefinition = ProjectConfiguration & { projectName: string };

export function listProjects(tree: Tree): ProjectDefinition[] {
  const projects = getProjects(tree);

  return Array.from(projects.entries()).map(([projectName, project]) => ({
    projectName,
    ...project,
  }));
}

export function updateProjects(
  tree: Tree,
  predicate: (projectName: string) => boolean
) {
  getProjects(tree).forEach((project, projectName) => {
    if (predicate(projectName)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      project.targets!.version = {
        executor: '@jscutlery/semver:version'
      };
      updateProjectConfiguration(tree, projectName, project);
    }
  });
}

export async function updateWorkspaceFromPrompt(tree: Tree): Promise<void> {
  const projects = listProjects(tree);
  const answers = await createPrompt(projects);

  return updateProjects(tree, (projectName) =>
    answers.projects.includes(projectName)
  );
}

export function updateWorkspaceFromSchema(
  tree: Tree,
  options: SchemaOptions
): void {
  return updateProjects(tree, (projectName) =>
    options.projects.includes(projectName)
  );
}
