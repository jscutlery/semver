import { createProjectGraphAsync } from '@nrwl/devkit';
import { getConfig } from './config';

export async function release(): Promise<void> {
  const config = await getConfig();
  const graph = await createProjectGraphAsync({
    exitOnError: true,
    resetDaemonClient: false,
  });

  for (const pkg of config.packages) {
    if (pkg.type === 'independent' && !(pkg.name in graph.nodes)) {
      throw new Error(`Could not find project "${pkg.name}"`);
    }
    if (
      pkg.type === 'group' &&
      !pkg.packages.every((child) => child.name in graph.nodes)
    ) {
      throw new Error(`Could not find all projects in group "${pkg.name}"`);
    }

    const node = graph.nodes[pkg.name];
  }
}
