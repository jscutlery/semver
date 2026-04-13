import type {
  ExecutorContext,
  ProjectConfiguration,
  ProjectGraphDependency,
  ProjectsConfigurations,
} from '@nx/devkit';
import type { VersionBuilderSchema } from '../schema';

export interface DependencyRoot {
  name: string;
  path: string;
  options?: VersionBuilderSchema;
}

/* istanbul ignore next */
export async function getDependencyRoots({
  trackDeps,
  releaseAs,
  projectName,
  context,
  trackDepsWithReleaseAs,
}: Required<Pick<VersionBuilderSchema, 'trackDeps'>> &
  Pick<VersionBuilderSchema, 'releaseAs' | 'trackDepsWithReleaseAs'> & {
    projectName: string;
    context: ExecutorContext;
  }): Promise<DependencyRoot[]> {
  if (trackDeps && (trackDepsWithReleaseAs || !releaseAs)) {
    // Include any depended-upon libraries in determining the version bump.
    return getDependencyRootsFromProjectNames(
      await getProjectDependencies(projectName),
      context.projectsConfigurations,
    );
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

export function getDependencyRootsFromProjectNames(
  projectNames: string[],
  projectsConfigurations: ProjectsConfigurations | undefined,
): DependencyRoot[] {
  if (projectsConfigurations == null) {
    return [];
  }

  return projectNames.flatMap((name) => {
    const project = projectsConfigurations.projects[name];
    if (project == null) {
      return [];
    }

    return {
      name,
      path: project.root,
      options: getProjectVersionBuilderSchema(project),
    };
  });
}

export function getProjectVersionBuilderSchema(
  project: ProjectConfiguration,
): VersionBuilderSchema | undefined {
  const versionTarget = Object.values(project.targets ?? {}).find(
    (target) => target.executor === '@jscutlery/semver:version',
  );
  if (!versionTarget) {
    return;
  }
  return versionTarget.options || undefined;
}

export function getProjectVersionBuilderSchemaFromContext(
  projectName: string,
  context: ExecutorContext,
): VersionBuilderSchema | undefined {
  const project = context.projectsConfigurations?.projects[projectName];
  if (project == null) {
    return;
  }
  return getProjectVersionBuilderSchema(project);
}
