import type { ExecutorContext } from '@nrwl/devkit';
import type { ProjectGraphDependency } from '@nrwl/workspace/src/core/project-graph';

import type { VersionBuilderSchema } from '../schema';

export async function getDependencyRoots({
  trackDeps,
  releaseAs,
  projectName,
  context,
}: Required<Pick<VersionBuilderSchema, 'trackDeps'>> &
  Pick<VersionBuilderSchema, 'releaseAs'> & {
    projectName: string;
    context: ExecutorContext;
  }): Promise<string[]> {
  if (trackDeps && !releaseAs) {
    // Include any depended-upon libraries in determining the version bump.
    return (await getProjectDependencies(projectName)).map(
      (name) => context.workspace.projects[name].root
    );
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
     @todo: remove the compatibility support later on.

     The shape of the project graph can still change.
     So we're pinning the version of the graph to 5.0. */
  const dependencyGraph =
    typeof module.createProjectGraphAsync === 'function'
      ? await module.createProjectGraphAsync('5.0')
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
