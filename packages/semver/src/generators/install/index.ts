import { addProjectConfiguration, formatFiles, installPackagesTask } from '@nrwl/devkit';

import { createTarget } from './utils/create-target';
import { addDependencies } from './utils/dependencies';
import { updateWorkspaceFromPrompt, updateWorkspaceFromSchema } from './utils/workspace';

import type { Tree } from '@nrwl/devkit';
import type { SchemaOptions } from './schema';

export default async function install(tree: Tree, options: SchemaOptions) {
  /* Synced versioning. */
  if (options.syncVersions) {
    addProjectConfiguration(
      tree,
      'workspace',
      {
        root: '.',
        targets: {
          version: createTarget(options),
        },
      },
      false
    );

    /* Independent versioning. */
  } else {
    options.projects && options.projects.length > 0
      ? updateWorkspaceFromSchema(tree, options)
      : await updateWorkspaceFromPrompt(tree, options);
  }

  addDependencies(tree, options);

  /* Supports Angular CLI workspace definition format, see https://github.com/nrwl/nx/discussions/6955#discussioncomment-1341893 */
  await formatFiles(tree);

  return () => {
    !options.skipInstall && installPackagesTask(tree);
  };
}
