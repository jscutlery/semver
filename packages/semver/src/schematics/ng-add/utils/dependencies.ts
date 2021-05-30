import { Rule, Tree } from '@angular-devkit/schematics';
import { addDepsToPackageJson, updateJsonInTree } from '@nrwl/workspace';

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

export function addDependencies(options: SchemaOptions): Rule {
  return () => {
    return addDepsToPackageJson(
      {},
      options.enforceConventionalCommits
        ? {
            commitizen: '^4.2.4',
            'cz-conventional-changelog': '^3.3.0',
            '@commitlint/cli': '^12.1.4',
            '@commitlint/config-conventional': '^12.1.4',
            husky: '^6.0.0',
          }
        : {},
      !options.skipInstall
    );
  };
}

export function addCommitizenConfig(options: SchemaOptions): Rule {
  return (tree: Tree) => {
    return updateJsonInTree(PACKAGE_JSON, (packageJson: PackageJson) => {
      if (options.enforceConventionalCommits) {
        const hasConfig: boolean =
          packageJson.config?.commitizen != null || tree.exists('.czrc');

        if (!hasConfig) {
          packageJson.scripts = { ...packageJson.scripts, ...{ cz: 'cz' } };
          packageJson.config = {
            ...packageJson.config,
            commitizen: { path: 'cz-conventional-changelog' },
          };
        }
      }

      return packageJson;
    });
  };
}

export function addCommitlintConfig(options: SchemaOptions): Rule {
  return (tree: Tree) => {
    return updateJsonInTree(PACKAGE_JSON, (packageJson: PackageJson) => {
      if (options.enforceConventionalCommits) {
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
      }

      return packageJson;
    });
  };
}

export function addHuskyConfig(options: SchemaOptions): Rule {
  return (tree: Tree) => {
    return updateJsonInTree(PACKAGE_JSON, (packageJson: PackageJson) => {
      if (options.enforceConventionalCommits) {
        const hasHusky: boolean = tree.exists('.husky/_/husky.sh');
        const hasConfigFile: boolean = tree.exists('.husky/commit-msg');

        if (!hasHusky) {
          packageJson.scripts = {
            ...packageJson.scripts,
            ...{ prepare: 'husky install' },
          };
        }

        if (!hasConfigFile) {
          const commitMsg = `#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\n\nnpx --no-install commitlint --edit $1\n`;
          tree.create('.husky/commit-msg', commitMsg);
        }
      }

      return packageJson;
    });
  };
}
