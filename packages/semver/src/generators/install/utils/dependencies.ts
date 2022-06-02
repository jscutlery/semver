import {
  addDependenciesToPackageJson,
  readJson,
  updateJson,
  type Tree,
} from '@nrwl/devkit';
import { constants } from 'fs';
import type { SchemaOptions } from '../schema';

const PACKAGE_JSON = 'package.json';

export interface PackageJson {
  scripts: PackageJsonPart<string>;
  devDependencies: PackageJsonPart<string>;
  commitlint: PackageJsonPart<string[]>;
}

export interface PackageJsonPart<T> {
  [key: string]: T;
}

export function addDependencies(tree: Tree, options: SchemaOptions) {
  if (options.enforceConventionalCommits) {
    _addCommitlintConfig(tree, options);
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
        '@commitlint/cli': '^17.0.0',
        [_getCommitlintConfig(options)]: '^17.0.0',
        husky: '^8.0.0',
      }
    );
  }
}

function _addCommitlintConfig(tree: Tree, options: SchemaOptions) {
  const packageJson = readJson(tree, PACKAGE_JSON);

  const hasConfig: boolean =
    packageJson.commitlint != null ||
    tree.exists('commitlint.config.js') ||
    tree.exists('commitlint') ||
    tree.exists('.commitlintrc.js') ||
    tree.exists('.commitlintrc.json') ||
    tree.exists('.commitlintrc.yml');

  if (!hasConfig) {
    tree.write(
      '.commitlintrc.json',
      JSON.stringify(
        {
          extends: [_getCommitlintConfig(options)],
          rules: {},
        },
        null,
        2
      )
    );
  }

  return tree;
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

function _getCommitlintConfig(options: SchemaOptions) {
  return options.preset === 'angular'
    ? '@commitlint/config-angular'
    : '@commitlint/config-conventional';
}
