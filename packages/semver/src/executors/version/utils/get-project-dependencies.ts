import { execAsync } from './exec-async';

interface ProjectGraphDependency {
  type: string;
  target: string;
  source: string;
}

/**
 * Returns a list of in-repo dependencies based on NX's dependency graph.
 */
export async function getProjectDependencies(projectName: string): Promise<string[]> {
  const dependencyGraph = await getParsedDependencyGraph();
  return Array.from(assembleDependenciesFromGraph(dependencyGraph, projectName));
}

async function getParsedDependencyGraph(): Promise<{[key: string]: ProjectGraphDependency[]}> {
  return new Promise((resolve, reject) => {
    execAsync('npm', ['run', '-s', 'nx print-affected'])
      .subscribe({
        next: output => resolve(JSON.parse(output.stdout).projectGraph.dependencies),
        error: err => reject(err.stderr)
      });
  });
}

function assembleDependenciesFromGraph(dependencyGraph: {[key: string]: ProjectGraphDependency[]}, projectName: string, traversedNodes: string[] = []): Set<string> {
    return getProjectsFromDependencies(dependencyGraph[projectName])
    .reduce((acc, dependency) => {
      // This if statement keeps us from getting caught in a circular dependency.
      if (traversedNodes.indexOf(dependency) === -1) {
        const subDependencies = assembleDependenciesFromGraph(dependencyGraph, dependency, [projectName, ...traversedNodes]);
        acc = new Set([...acc, dependency, ...subDependencies]);
      }
      return acc;
    }, new Set<string>());
}

/**
 * Gets only the dependencies that are in the project. Not NPM packages.
 */
function getProjectsFromDependencies(dependencies: ProjectGraphDependency[]): string[] {
  return dependencies
    .filter(d => !d.target.startsWith('npm:'))
    .map(d => d.target);
}
