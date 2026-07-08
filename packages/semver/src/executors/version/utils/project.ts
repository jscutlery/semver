import { resolve } from 'path';
import { readFileIfExists, readJsonFile, writeFile } from './filesystem';
import { logStep } from './logger';
import * as detectIndent from 'detect-indent';

export function readPackageJson(projectRoot: string): Promise<{
  version?: string;
}> {
  return readJsonFile(getPackageJsonPath(projectRoot)) as Promise<{
    version?: string;
  }>;
}

export function getPackageJsonPath(projectRoot: string) {
  return resolve(projectRoot, 'package.json');
}

/* istanbul ignore next */
export async function updatePackageJson({
  newVersion,
  projectRoot,
  projectName,
  dryRun,
}: {
  newVersion: string;
  projectRoot: string;
  projectName: string;
  dryRun: boolean;
}): Promise<string | null> {
  if (dryRun) {
    return null;
  }

  const path = getPackageJsonPath(projectRoot);

  const packageJson = await readFileIfExists(path);

  if (!packageJson.length) {
    return null;
  }

  const newPackageJson = _updatePackageVersion(packageJson, newVersion);

  await writeFile(path, newPackageJson);

  logStep({
    step: 'package_json_success',
    message: `Updated package.json version.`,
    projectName,
  });

  return path;
}

/* istanbul ignore next */
function _updatePackageVersion(packageJson: string, version: string): string {
  const data = JSON.parse(packageJson);
  const { indent } = detectIndent(packageJson);
  return _stringifyJson({ ...data, version }, indent);
}

/* istanbul ignore next */
function _stringifyJson(data: unknown, indent: string | number): string {
  // We need to add a newline at the end so that Prettier will not complain about the new file.
  return JSON.stringify(data, null, indent).concat('\n');
}
