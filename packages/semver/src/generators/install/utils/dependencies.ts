import type { Tree } from '@nrwl/devkit';
import { addDependenciesToPackageJson } from '@nrwl/devkit';
import { updateJson } from '@nrwl/devkit';
import { constants } from 'fs';

import { SchemaOptions } from '../schema';

const PACKAGE_JSON = 'package.json';

export interface PackageJson {
  scripts: PackageJsonPart<string>;
  devDependencies: PackageJsonPart<string>;
  config?: {
    commitizen?: PackageJsonPart<string>;
  };
  commitlint: PackageJsonPart<string[]>;
}

export interface PackageJsonPart<T> {
  [key: string]: T;
}

export function addDependencies(tree: Tree, options: SchemaOptions) {
  if (options.enforceConventionalCommits) {
    _addCommitizenConfig(tree);
    _addCommitlintConfig(tree);
    _addHuskyConfig(tree);
    _addHuskyConfigMsg(tree);
    _addDevDependencies(tree, options);
  }
}

function _addDevDependencies(tree: Tree, options: SchemaOptions) {
  if (!options.skipInstall) {
    addDependenciesToPackageJson(
      tree,
      {},
      {
        commitizen: '^4.2.4',
        'cz-conventional-changelog': '^3.3.0',
        '@commitlint/cli': '^12.1.4',
        '@commitlint/config-conventional': '^12.1.4',
        husky: '^6.0.0',
      }
    );
  }
}

function _addCommitizenConfig(tree: Tree) {
  return updateJson(tree, PACKAGE_JSON, (packageJson: PackageJson) => {
    const hasConfig: boolean =
      packageJson.config?.commitizen != null || tree.exists('.czrc');

    if (!hasConfig) {
      packageJson.scripts = { ...packageJson.scripts, ...{ cz: 'cz' } };
      packageJson.config = {
        ...packageJson.config,
        commitizen: { path: 'cz-conventional-changelog' },
      };
    }

    return packageJson;
  });
}

function _addCommitlintConfig(tree: Tree) {
  return updateJson(tree, PACKAGE_JSON, (packageJson: PackageJson) => {
    const hasConfig: boolean =
      packageJson.commitlint != null ||
      tree.exists('commitlint.config.js') ||
      tree.exists('commitlint') ||
      tree.exists('.commitlintrc.js') ||
      tree.exists('.commitlintrc.json') ||
      tree.exists('.commitlintrc.yml');

    if (!hasConfig) {
      packageJson.commitlint = {
        ...packageJson.commitlint,
        extends: ['@commitlint/config-conventional'],
      };
    }

    return packageJson;
  });
}

function _addHuskyConfig(tree: Tree) {
  return updateJson(tree, PACKAGE_JSON, (packageJson: PackageJson) => {
    const hasHusky: boolean = tree.exists('.husky/_/husky.sh');

    if (!hasHusky) {
      packageJson.scripts = {
        ...packageJson.scripts,
        ...{ prepare: 'husky install' },
      };
    }

    return packageJson;
  });
}

function _addHuskyConfigMsg(tree: Tree) {
  const hasConfigFile: boolean = tree.exists('.husky/commit-msg');

  if (!hasConfigFile) {
    const commitMsg = `#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\n\nnpx --no-install commitlint --edit $1\n`;

    tree.write('.husky/commit-msg', commitMsg, {
      /* File mode indicating readable, writable, and executable by owner. */
      mode: constants.S_IRWXU,
    });
  }
}
