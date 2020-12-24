import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addPackageJsonDependency, NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';

import { getLatestNodeVersion } from '../../utils/npm';
import { SchemaOptions } from './schema';

const PACKAGE_NAME = '@jscutlery/semver';

function addDependency(): Rule {
  return (tree, ctx): any => {
    return of(PACKAGE_NAME).pipe(
      concatMap((dep) => getLatestNodeVersion(dep)),
      map(({ name, version }) => {
        ctx.logger.info(
          `✅️ Added ${name}@${version} to ${NodeDependencyType.Dev}`
        );
        const nodeDependency: NodeDependency = {
          name,
          version,
          type: NodeDependencyType.Dev,
          overwrite: false,
        };
        addPackageJsonDependency(tree, nodeDependency);
        return tree;
      })
    );
  };
}

function installDependencies(): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    ctx.addTask(new NodePackageInstallTask());
    ctx.logger.debug('✅️ Dependencies installed');
    return tree;
  };
}

export function ngAdd(options: SchemaOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return chain([
      addDependency(),
      installDependencies()
    ]);
  };
}
