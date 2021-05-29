import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { join } from 'path';

const PACKAGE_JSON = 'package.json';

export interface PackageJson {
  scripts: PackageJsonConfigPart<string>;
  devDependencies: PackageJsonConfigPart<string>;
  config?: {
    commitizen?: PackageJsonConfigPart<any>;
  };
  commitlint: PackageJsonConfigPart<any>;
  [key: string]: any;
}

export interface PackageJsonConfigPart<T> {
  [key: string]: T;
}

class FileNotFoundException extends Error {
  constructor(fileName: string) {
    const message = `File ${fileName} not found!`;
    super(message);
  }
}

export function getPackageJson(tree: Tree, workingDirectory = ''): PackageJson {
  const url = join(workingDirectory, PACKAGE_JSON);

  return getJsonFile(tree, url);
}

export function getJsonFile<T>(tree: Tree, path: string): T {
  const file = tree.get(path);
  if (!file) {
    throw new FileNotFoundException(path);
  }

  try {
    const content = JSON.parse(file.content.toString());

    return content as T;
  } catch (e) {
    throw new SchematicsException(`File ${path} could not be parsed!`);
  }
}

export function overwritePackageJson(
  tree: Tree,
  packageJson: PackageJson,
  content: PackageJsonConfigPart<any>,
  workingDirectory = ''
) {
  const newJson: PackageJson = { ...packageJson, ...content };
  const url = join(workingDirectory, PACKAGE_JSON);

  tree.overwrite(url, JSON.stringify(newJson, null, 2));
}
