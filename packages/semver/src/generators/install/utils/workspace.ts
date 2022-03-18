import { getProjects, updateProjectConfiguration, type ProjectConfiguration } from '@nrwl/devkit';

import { createTarget } from './create-target';
import { createPrompt } from './prompt';

import type { Tree } from '@nrwl/devkit';
import type { SchemaOptions } from '../schema';

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
  options: SchemaOptions,
  predicate: (projectName: string) => boolean
) {
  getProjects(tree).forEach((project, projectName) => {
    if (predicate(projectName)) {

      const targets = project.targets ?? {};
      targets.version = createTarget(options);

      updateProjectConfiguration(tree, projectName, project);
    }
  });
}

export async function updateWorkspaceFromPrompt(
  tree: Tree,
  options: SchemaOptions
): Promise<void> {
  const projects = listProjects(tree);
  const answers = await createPrompt(projects);

  return updateProjects(tree, options, (projectName) =>
    answers.projects.includes(projectName)
  );
}

export function updateWorkspaceFromSchema(
  tree: Tree,
  options: SchemaOptions
): void {
  return updateProjects(
    tree,
    options,
    (projectName) => options.projects?.includes(projectName) as boolean
  );
}
