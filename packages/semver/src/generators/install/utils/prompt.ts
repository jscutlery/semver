import * as inquirer from 'inquirer';

import type { ProjectDefinition } from './workspace';

export function createPrompt(
  projects: ProjectDefinition[]
): Promise<{ projects: string[] }> {
  return inquirer.prompt({
    name: 'projects',
    type: 'checkbox',
    message: 'Which projects would you like to version independently?',
    choices: projects.map(({ projectName }) => ({
      name: projectName,
      checked: true,
    })),
  });
}
