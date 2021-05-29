import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { SchemaOptions } from '../schema';
import { COMMITIZEN, COMMITLINT, HUSKY } from './dependencies';
import { getPackageJson, overwritePackageJson, PackageJson, PackageJsonConfigPart } from './package-json';

export function addDependencies(options: SchemaOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (options.enforceConventionalCommits === true) {
      addCommitizen(tree);
      addCommitlint(tree);
      addHusky(tree);
      installDependencies(options, context);
    }
  };
}

export function addCommitizen(tree: Tree) {
  addDevDependencies(COMMITIZEN, tree);
  addCommitizenConfig(tree);
  addCommitizenScrip(tree);
}

export function addCommitizenConfig(tree: Tree) {
  const packageJson: PackageJson = getPackageJson(tree);
  const hasConfig: boolean =
    packageJson.config?.commitizen != null || tree.exists('.czrc');

  if (!hasConfig) {
    const config: PackageJsonConfigPart<any> = {
      config: {
        ...packageJson.config,
        commitizen: {
          path: 'cz-conventional-changelog',
        },
      },
    };

    overwritePackageJson(tree, packageJson, config);
  }
}

export function addCommitizenScrip(tree: Tree) {
  const packageJson: PackageJson = getPackageJson(tree);
  const scripts = { scripts: { ...packageJson.scripts, ...{ cz: 'cz' } } };

  overwritePackageJson(tree, packageJson, scripts);
}

export function addCommitlint(tree: Tree) {
  addDevDependencies(COMMITLINT, tree);
  addCommitlintConfig(tree);
}

export function addCommitlintConfig(tree: Tree) {
  const packageJson: PackageJson = getPackageJson(tree);
  const hasConfig: boolean =
    packageJson.commitlint != null ||
    tree.exists('commitlint.config.js') ||
    tree.exists('commitlint') ||
    tree.exists('.commitlintrc.js') ||
    tree.exists('.commitlintrc.json') ||
    tree.exists('.commitlintrc.yml');

  if (!hasConfig) {
    const config = {
      commitlint: {
        extends: ['@commitlint/config-conventional'],
      },
    };

    overwritePackageJson(tree, packageJson, config);
  }
}

export function addHusky(tree: Tree) {
  addDevDependencies(HUSKY, tree);
  addHuskyConfig(tree);
}

export function addHuskyConfig(tree: Tree) {
  const hasHusky: boolean = tree.exists('.husky/_/husky.sh');
  const hasConfigFile: boolean = tree.exists('.husky/commit-msg');

  if (!hasHusky) {
    const packageJson: PackageJson = getPackageJson(tree);
    const scripts = {
      scripts: {
        ...packageJson.scripts,
        ...{
          prepare: 'husky install',
        },
      },
    };

    overwritePackageJson(tree, packageJson, scripts);
  }

  if (!hasConfigFile) {
    const commitMsg = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no-install commitlint --edit $1
`;

    tree.create('.husky/commit-msg', commitMsg);
  }
}

export function addDevDependencies(
  dependencies: PackageJsonConfigPart<string>,
  tree: Tree
) {
  const packageJson: PackageJson = getPackageJson(tree);
  const devDependencies = {
    devDependencies: { ...packageJson.devDependencies, ...dependencies },
  };

  overwritePackageJson(tree, packageJson, devDependencies);
}

function installDependencies(
  options: SchemaOptions,
  context: SchematicContext
) {
  if (options.skipInstall !== true) {
    context.addTask(new NodePackageInstallTask());
  }
}
