import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { updateJsonInTree, updateWorkspace } from '@nrwl/workspace';

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
  return async (tree: Tree, ctx: SchematicContext) => {
    return chain([
      await updateDependencies(),
      installDependencies(),
      updateWorkspace((workspace) => {
        if (options.syncVersions) {
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
        }
      }),
    ]);
  };
}
