import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { SchemaOptions } from '../schema';
import {
  getMergedPackageJsonConfig,
  getPackageJson,
  overwritePackageJson,
  PackageJson,
  PackageJsonConfigPart,
} from './package-json';

const COMMITIZEN = {
  commitizen: '^4.2.4',
  'cz-conventional-changelog': '^3.3.0',
};

const COMMITLINT = {
  '@commitlint/cli': '^12.1.4',
  '@commitlint/config-conventional': '^12.1.4',
};

const HUSKY = {
  husky: '^6.0.0',
};

export function addDependencies(options: SchemaOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (options.enforceConventionalCommits) {
      addCommitizen(options, tree, context);
      addCommitlint(options, tree, context);
      addHusky(options, tree, context);
    }
  };
}

export function addCommitizen(
  options: SchemaOptions,
  tree: Tree,
  context: SchematicContext
) {
  addDevDependencies(COMMITIZEN, options, tree, context);
  addCommitizenConfig(tree);
  addCommitizenScrip(tree);
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

export function addCommitlint(
  options: SchemaOptions,
  tree: Tree,
  context: SchematicContext
) {
  addDevDependencies(COMMITLINT, options, tree, context);
  addCommitlintConfig(tree);
}

export function addCommitlintConfig(tree: Tree) {
  const packageJson: PackageJson = getPackageJson(tree);
  const hasConfigFile =
    tree.exists('commitlint.config.js') ||
    tree.exists('commitlint') ||
    tree.exists('.commitlintrc.js') ||
    tree.exists('.commitlintrc.json') ||
    tree.exists('.commitlintrc.yml');

  if (!packageJson?.commitlint && !hasConfigFile) {
    const config = {
      commitlint: {
        extends: ['@commitlint/config-conventional'],
      },
    };
    const newJson: PackageJson = getMergedPackageJsonConfig(
      config,
      packageJson
    ) as PackageJson;
    overwritePackageJson(tree, newJson);
  }
}

export function addHusky(
  options: SchemaOptions,
  tree: Tree,
  context: SchematicContext
) {
  addDevDependencies(HUSKY, options, tree, context);
  addHuskyScrip(tree);
}

export function addHuskyScrip(tree: Tree) {
  const packageJson: PackageJson = getPackageJson(tree);
  const scripts = {
    scripts: {
      ...packageJson.scripts,
      ...{
        prepare: 'husky install',
      },
    },
  };
  const commitMsg = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no-install commitlint --edit $1`;
  tree.create('.husky/commit-msg', commitMsg);
  const newJson: PackageJson = getMergedPackageJsonConfig(
    scripts,
    packageJson
  ) as PackageJson;
  overwritePackageJson(tree, newJson);
}

export function addDevDependencies(
  deps: PackageJsonConfigPart<string>,
  options: SchemaOptions,
  tree: Tree,
  context: SchematicContext
) {
  const packageJson: PackageJson = getPackageJson(tree);
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

function installDependencies(
  options: SchemaOptions,
  context: SchematicContext
) {
  if (options.skipInstall !== true) {
    context.addTask(new NodePackageInstallTask());
  }
}
