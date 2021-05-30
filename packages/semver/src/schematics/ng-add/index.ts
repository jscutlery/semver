import { chain, noop, Rule, Tree } from '@angular-devkit/schematics';
import { updateNxJsonInTree, updateWorkspace } from '@nrwl/workspace';

import { SchemaOptions } from './schema';
import {
  addCommitizenConfig,
  addCommitlintConfig,
  addDependencies,
  addHuskyConfig,
  addHuskyConfigMsg,
} from './utils/dependencies';
import { updateWorkspaceFromPrompt, updateWorkspaceFromSchema } from './utils/workspace';

export function ngAdd(options: SchemaOptions): Rule {
  return async (tree: Tree) => {
    return chain([
      ...(options.syncVersions
        ? /* Synced versioning. */
          [
            updateWorkspace((workspace) => {
              /* Create a global project named 'workspace' to run the 'version' builder globally. */
              workspace.projects.add({
                name: 'workspace',
                root: '.',
                architect: {
                  version: {
                    builder: '@jscutlery/semver:version',
                    options: { syncVersions: true },
                  },
                },
              });
            }),
            updateNxJsonInTree((nxConfig) => ({
              ...nxConfig,
              projects: {
                ...nxConfig.projects,
                workspace: { tags: [] },
              },
            })),
          ]
        : /* Independent versioning. */
          [
            options.projects.length > 0
              ? updateWorkspaceFromSchema(options)
              : await updateWorkspaceFromPrompt(tree),
          ]),
      options.enforceConventionalCommits ? addDependencies(options) : noop(),
      options.enforceConventionalCommits ? addCommitizenConfig() : noop(),
      options.enforceConventionalCommits ? addCommitlintConfig() : noop(),
      options.enforceConventionalCommits ? addHuskyConfig() : noop(),
      options.enforceConventionalCommits ? addHuskyConfigMsg() : noop(),
    ]);
  };
}
