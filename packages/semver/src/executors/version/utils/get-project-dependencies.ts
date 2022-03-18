import type { ExecutorContext, ProjectGraphDependency } from '@nrwl/devkit';

import type { VersionBuilderSchema } from '../schema';

export interface DependencyRoot {
  name: string;
  path: string;
}

export async function getDependencyRoots({
  trackDeps,
  releaseAs,
  projectName,
  context,
}: Required<Pick<VersionBuilderSchema, 'trackDeps'>> &
  Pick<VersionBuilderSchema, 'releaseAs'> & {
    projectName: string;
    context: ExecutorContext;
  }): Promise<DependencyRoot[]> {
  if (trackDeps && !releaseAs) {
    // Include any depended-upon libraries in determining the version bump.
    return (await getProjectDependencies(projectName)).map((name) => ({
      name,
      path: context.workspace.projects[name].root,
    }));
  }

  return [];
}

/**
 * Returns a list of in-repo dependencies based on NX's dependency graph.
 */
export async function getProjectDependencies(
  projectName: string
): Promise<string[]> {
  const module = await import('@nrwl/workspace/src/core/project-graph');
  /* @notice: before Nx 13 `createProjectGraphAsync` doesn't exist.
     @todo: remove the compatibility support later on. */
  const dependencyGraph =
    typeof module.createProjectGraphAsync === 'function'
      ? await module.createProjectGraphAsync()
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (module as any).createProjectGraph();
  return getProjectsFromDependencies(dependencyGraph.dependencies[projectName]);
}

/**
 * Gets only the dependencies that are in the project. Not NPM packages.
 */
function getProjectsFromDependencies(
  dependencies: ProjectGraphDependency[]
): string[] {
  return dependencies
    .filter((d) => !d.target.startsWith('npm:'))
    .map((d) => d.target);
}
