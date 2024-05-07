import type { ExecutorContext, ProjectGraphDependency } from '@nx/devkit';
import type { VersionBuilderSchema } from '../schema';

export interface DependencyRoot {
  name: string;
  path: string;
}

/* istanbul ignore next */
export async function getDependencyRoots({
  context,
  projectName,
  releaseAs,
  trackDeps,
  trackDepsWithReleaseAs,
}: Required<Pick<VersionBuilderSchema, 'trackDeps'>> &
  Pick<VersionBuilderSchema, 'releaseAs' | 'trackDepsWithReleaseAs'> & {
    projectName: string;
    context: ExecutorContext;
  }): Promise<DependencyRoot[]> {
  if (trackDeps && (trackDepsWithReleaseAs || !releaseAs)) {
    // Include any depended-upon libraries in determining the version bump.
    return (await getProjectDependencies(projectName)).map((name) => ({
      name,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      path: context.projectsConfigurations!.projects[name].root,
    }));
  }

  return [];
}

/* istanbul ignore next */
export async function getProjectDependencies(
  projectName: string,
): Promise<string[]> {
  const { createProjectGraphAsync } = await import('@nx/devkit');
  const dependencyGraph = await createProjectGraphAsync();

  return getProjectsFromDependencies(dependencyGraph.dependencies[projectName]);
}

/* istanbul ignore next */
function getProjectsFromDependencies(
  dependencies: ProjectGraphDependency[],
): string[] {
  return dependencies
    .filter((d) => !d.target.startsWith('npm:'))
    .map((d) => d.target);
}
