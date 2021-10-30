// The shape of the project graph is still subject to changes, but
// can still be used, according to the NX devs. That's why we're
// doing a deep import here.
import { createProjectGraphAsync, ProjectGraphDependency } from '@nrwl/workspace/src/core/project-graph';

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
