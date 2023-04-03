import { createProjectGraphAsync, ProjectGraph } from '@nrwl/devkit';
import * as semver from 'semver';
import { getConfig, GroupConfig, IndependentConfig } from './config';
import { getCurrentVersion } from './version';

export async function release(): Promise<void> {
  const config = await getConfig();
  const graph = await createProjectGraphAsync({
    exitOnError: true,
    resetDaemonClient: false,
  });

  for (const pkg of config.packages) {
    checkPackageExists(pkg, graph);

    const node = graph.nodes[pkg.name];
    const tagPrefix = pkg.tagPrefix ?? `${pkg.name}-`;

    // const path = pkg.type === 'independent' ? node.data.root : pkg.path;

    if (pkg.type === 'group') {
      // TODO: implement group release
      console.log(
        `Abort: Releasing ${pkg.name} is not yet implemented. Skipping.`
      );
    }

    if (pkg.type === 'independent') {
      const currentVersion = await getCurrentVersion({ tagPrefix });

      const nextVersion = semver.inc(currentVersion, 'major');

      console.log(
        `Releasing ${pkg.name} from ${currentVersion} to ${nextVersion}`
      );
    }
  }
}

function checkPackageExists(
  pkg: GroupConfig | IndependentConfig,
  graph: ProjectGraph
) {
  if (pkg.type === 'independent' && !(pkg.name in graph.nodes)) {
    throw new Error(`Could not find project "${pkg.name}"`);
  }
  if (
    pkg.type === 'group' &&
    !pkg.packages.every((child) => child.name in graph.nodes)
  ) {
    throw new Error(`Could not find all projects in group "${pkg.name}"`);
  }
}
