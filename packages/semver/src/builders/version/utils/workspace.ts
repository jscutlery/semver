import { resolve } from 'path';

import { SemverConfig } from '../schema';

/**
 * @internal
 */
export function getPackageFiles(projectsRoot: string[]): string[] {
  return projectsRoot.map((projectRoot) => resolve(projectRoot, 'package.json'))
}

/**
 * @internal
 */
export function getProjectsRoot({
  workspaceRoot,
  config,
}: {
  workspaceRoot: string;
  config: SemverConfig;
}): string[] {
  return config.packages.map((projectRoot) =>
    resolve(workspaceRoot, projectRoot)
  );
}
