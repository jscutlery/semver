import type { Tree } from '@nrwl/devkit';
import { addProjectConfiguration } from '@nrwl/devkit';

import { SchemaOptions } from './schema';
import { addDependencies } from './utils/dependencies';
import {
  updateWorkspaceFromPrompt,
  updateWorkspaceFromSchema,
} from './utils/workspace';

export async function install(tree: Tree, options: SchemaOptions) {
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
    options.projects.length > 0
      ? updateWorkspaceFromSchema(tree, options)
      : await updateWorkspaceFromPrompt(tree);
  }

  addDependencies(tree, options);
}
