import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { SchemaOptions } from '../schema';
import { getMergedPackageJsonConfig, getPackageJson, overwritePackageJson, PackageJson } from './package-json';

export function addDependencies(options: SchemaOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (options.enforceConventionalCommits) {
      addCommitizen(options, tree, context);
    }
  };
}

export function addCommitizen(
  options: SchemaOptions,
  tree: Tree,
  context: SchematicContext
) {
  addCommitizenDeps(options, tree, context);
  addCommitizenConfig(tree);
  addCommitizenScrip(tree);
}

export function addCommitizenDeps(
  options: SchemaOptions,
  tree: Tree,
  context: SchematicContext
) {
  const packageJson: PackageJson = getPackageJson(tree);
  const deps = {
    commitizen: '^4.2.4',
    'cz-conventional-changelog': '^3.3.0',
  };
  const devDependencies = {
    devDependencies: { ...packageJson.devDependencies, ...deps },
  };
  const newJson: PackageJson = getMergedPackageJsonConfig(
    devDependencies,
    packageJson
  ) as PackageJson;
  overwritePackageJson(tree, newJson);
  installDependencies(options, context);
}

export function addCommitizenConfig(tree: Tree) {
  const packageJson: PackageJson = getPackageJson(tree);
  const hasConfigFile = tree.exists('.czrc');

  if (!packageJson?.config?.commitizen && !hasConfigFile) {
    const config = {
      config: {
        ...packageJson?.config,
        commitizen: {
          path: 'cz-conventional-changelog',
        },
      },
    };
    const newJson: PackageJson = getMergedPackageJsonConfig(
      config,
      packageJson
    ) as PackageJson;
    overwritePackageJson(tree, newJson);
  }
}

export function addCommitizenScrip(tree: Tree) {
  const packageJson: PackageJson = getPackageJson(tree);
  const scripts = {
    scripts: { ...packageJson.scripts, ...{ cz: 'cz' } },
  };
  const newJson: PackageJson = getMergedPackageJsonConfig(
    scripts,
    packageJson
  ) as PackageJson;
  overwritePackageJson(tree, newJson);
}

function installDependencies(
  options: SchemaOptions,
  context: SchematicContext
) {
  if (options.skipInstall !== true) {
    context.logger.info('Installs npm dependencies');
    context.addTask(new NodePackageInstallTask());
  }
}
