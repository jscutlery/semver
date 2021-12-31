// The shape of the project graph is still subject to changes, but
// can still be used, according to the NX devs. That's why we're
// doing a deep import here.
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph';

import { ExecutorContext } from '@nrwl/devkit';
import type { ProjectGraphDependency } from '@nrwl/workspace/src/core/project-graph';

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
  // The shape of the project graph can still change. So we're pinning the
  // version of the graph to 5.0.
  const dependencyGraph = await createProjectGraphAsync('5.0');
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
