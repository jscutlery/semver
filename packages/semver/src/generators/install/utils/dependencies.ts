import {
  addDependenciesToPackageJson,
  readJson,
  updateJson,
  type Tree,
  logger,
  detectPackageManager,
} from '@nx/devkit';
import { constants } from 'fs';
import type { SchemaOptions } from '../schema';

const PACKAGE_JSON = 'package.json';
const COMMITLINT_VERSION = '^18.0.0';
const HUSKY_VERSION = '^8.0.0';

interface PackageJson {
  scripts: PackageJsonPart<string>;
  devDependencies: PackageJsonPart<string>;
  commitlint: PackageJsonPart<string[]>;
}

interface PackageJsonPart<T> {
  [key: string]: T;
}

export function addDependencies(tree: Tree, options: SchemaOptions) {
  if (options.enforceConventionalCommits) {
    const preset = _getCommitlintConfig(options);

    if (preset === null) {
      logger.warn(
        `No commitlint config found for ${options.preset} preset, --enforceConventionalCommits option ignored.`,
      );
      return tree;
    }

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
        '@commitlint/cli': COMMITLINT_VERSION,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        [_getCommitlintConfig(options)!]: COMMITLINT_VERSION,
        husky: HUSKY_VERSION,
      },
    );
  }
}

function _addCommitlintConfig(tree: Tree, options: SchemaOptions) {
  const packageJson = readJson(tree, PACKAGE_JSON);

  const hasConfig: boolean =
    packageJson.commitlint != null ||
    [
      'commitlint.config.js',
      'commitlint',
      '.commitlintrc.js',
      '.commitlintrc.json',
      '.commitlintrc.yml',
    ].some((file) => tree.exists(file));

  if (!hasConfig) {
    tree.write(
      '.commitlintrc.json',
      JSON.stringify(
        {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          extends: [_getCommitlintConfig(options)!],
          rules: {},
        },
        null,
        2,
      ),
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
  const packageManager = detectPackageManager(tree.root);
  const command =
    packageManager === 'npm'
      ? 'npx --no-install'
      : packageManager === 'yarn'
        ? 'yarn run'
        : 'pnpm';

  if (!hasConfigFile) {
    const commitMsg = `#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\n\n${command} commitlint --edit "$1"\n`;

    tree.write('.husky/commit-msg', commitMsg, {
      /* File mode indicating readable, writable, and executable by owner. */
      mode: constants.S_IRWXU,
    });
  }
}

function _getCommitlintConfig(options: SchemaOptions): string | null {
  switch (options.preset) {
    case 'angular':
      return '@commitlint/config-angular';
    case 'conventionalcommits':
      return '@commitlint/config-conventional';
    default:
      return null;
  }
}
