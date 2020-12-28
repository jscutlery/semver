import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  updateJsonInTree,
  updateNxJsonInTree,
  updateWorkspace,
} from '@nrwl/workspace';

import { SchemaOptions } from './schema';
import { getLatestNodeVersion } from './utils';

const PACKAGE_NAME = '@jscutlery/semver';

async function updateDependencies(): Promise<Rule> {
  const { version } = await getLatestNodeVersion(PACKAGE_NAME);
  return updateJsonInTree('package.json', (json) => {
    delete json.dependencies[PACKAGE_NAME];
    json.devDependencies[PACKAGE_NAME] = version;
    return json;
  });
}

function installDependencies(): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    ctx.addTask(new NodePackageInstallTask());
    ctx.logger.debug('✅️ Dependencies installed');
    return tree;
  };
}

export function ngAdd(options: SchemaOptions): Rule {
  return async () => {
    return chain([
      await updateDependencies(),
      installDependencies(),
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
                throw new Error(
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
