import { workspaces } from '@angular-devkit/core';
import { Rule, Tree } from '@angular-devkit/schematics';
import { getWorkspace, updateWorkspace } from '@nrwl/workspace';

import { SchemaOptions } from '../schema';
import { createPrompt } from './prompt';

export type ProjectDefinition = workspaces.ProjectDefinition & { projectName: string };

export async function listProjects(tree: Tree): Promise<ProjectDefinition[]> {
  const { projects } = await getWorkspace(tree);
  return Array.from(projects.entries()).map(([projectName, project]) => ({
    projectName,
    ...project,
  }));
}

export function updateProjects(predicate: (projectName: string) => boolean): Rule {
  return updateWorkspace((workspace) => {
    workspace.projects.forEach((project, projectName) => {
      if (predicate(projectName)) {
        project.targets.add({
          name: 'version',
          builder: '@jscutlery/semver:version',
          options: { syncVersions: false },
        });
      }
    });
  });
}

export async function updateWorkspaceFromPrompt(tree: Tree): Promise<Rule> {
  const projects = await listProjects(tree);
  const answers = await createPrompt(projects);

  return updateProjects((projectName) =>
    answers.projects.includes(projectName)
  );
}

export function updateWorkspaceFromSchema(options: SchemaOptions): Rule {
  return updateProjects((projectName) =>
    options.projects.includes(projectName)
  );
}
