import { chain, Rule, SchematicsException } from '@angular-devkit/schematics';
import { updateNxJsonInTree, updateWorkspace } from '@nrwl/workspace';

import { SchemaOptions } from './schema';

export function ngAdd(options: SchemaOptions): Rule {
  return () => {
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
            updateWorkspace((workspace) => {
              /* Otherwise configure the 'version' builder for the given project. */
              if (options.projectName == null) {
                throw new SchematicsException(
                  'Missing option --project-name should be passed for independent versions.'
                );
              }

              const { targets } = workspace.projects.get(options.projectName);

              targets.add({
                name: 'version',
                builder: '@jscutlery/semver:version',
                options: { syncVersions: false },
              });
            }),
          ]),
    ]);
  };
}
