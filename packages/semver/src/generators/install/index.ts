import { addProjectConfiguration, installPackagesTask } from '@nrwl/devkit';

import { addDependencies } from './utils/dependencies';
import { updateWorkspaceFromPrompt, updateWorkspaceFromSchema } from './utils/workspace';

import type { Tree } from '@nrwl/devkit';
import type { SchemaOptions } from './schema';

export default async function install(tree: Tree, options: SchemaOptions) {
  /* Synced versioning. */
  if (options.syncVersions) {
    addProjectConfiguration(tree, 'workspace', {
      root: '.',
      targets: {
        version: {
          executor: '@jscutlery/semver:version',
          options: { syncVersions: true },
        },
      },
    });

    /* Independent versioning. */
  } else {
    options.projects?.length > 0
      ? updateWorkspaceFromSchema(tree, options)
      : await updateWorkspaceFromPrompt(tree);
  }

  addDependencies(tree, options);

  return () => {
    !options.skipInstall && installPackagesTask(tree);
  };
}
