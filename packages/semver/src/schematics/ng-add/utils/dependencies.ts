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

export function addCommitlint(tree: Tree) {
  addDevDependencies(COMMITLINT, tree);
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

export function addHusky(tree: Tree) {
  addDevDependencies(HUSKY, tree);
  addHuskyConfig(tree);
}

export function addHuskyConfig(tree: Tree) {
  const hasHusky = tree.exists('.husky');
  const hasConfigFile = tree.exists('.husky/commit-msg');

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
    const newJson: PackageJson = getMergedPackageJsonConfig(
      scripts,
      packageJson
    ) as PackageJson;
    overwritePackageJson(tree, newJson);
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
  deps: PackageJsonConfigPart<string>,
  tree: Tree
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
}

function installDependencies(
  options: SchemaOptions,
  context: SchematicContext
) {
  if (options.skipInstall !== true) {
    context.addTask(new NodePackageInstallTask());
  }
}
