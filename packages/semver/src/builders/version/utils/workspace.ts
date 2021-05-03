import { resolve } from 'path';
import { Observable } from 'rxjs';

import { SemverConfig } from '../schema';
import { readJsonFile } from './filesystem';

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

/**
 * @internal
 */
export function readPackageJson(
  projectRoot: string
): Observable<{
  version?: string;
}> {
  return readJsonFile(getPackageJsonPath(projectRoot));
}

/**
 * @internal
 */
export function getPackageJsonPath(projectRoot: string) {
  return resolve(projectRoot, 'package.json');
}

/**
 * @internal
 */
 export function getChangelogPath(projectRoot: string) {
  return resolve(projectRoot, 'CHANGELOG.md');
}
