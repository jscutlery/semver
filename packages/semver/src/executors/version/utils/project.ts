import { resolve } from 'path';
import { map, of, switchMap, type Observable } from 'rxjs';
import { readFileIfExists, readJsonFile, writeFile } from './filesystem';
import { logStep } from './logger';
import * as detectIndent from 'detect-indent';

export function readPackageJson(projectRoot: string): Observable<{
  version?: string;
}> {
  return readJsonFile(getPackageJsonPath(projectRoot));
}

export function getPackageJsonPath(projectRoot: string) {
  return resolve(projectRoot, 'package.json');
}

/**
 * Safely update package.json file.
 */
export function updatePackageJson({
  newVersion,
  projectRoot,
  projectName,
  dryRun,
}: {
  newVersion: string;
  projectRoot: string;
  projectName: string;
  dryRun: boolean;
}): Observable<string | null> {
  if (dryRun) {
    return of(null);
  }

  const path = getPackageJsonPath(projectRoot);

  return readFileIfExists(path).pipe(
    switchMap((packageJson) => {
      if (!packageJson.length) {
        return of(null);
      }

      const newPackageJson = _updatePackageVersion(packageJson, newVersion);

      return writeFile(path, newPackageJson).pipe(
        logStep({
          step: 'package_json_success',
          message: `Updated package.json version.`,
          projectName,
        }),
        map(() => path)
      );
    })
  );
}

function _updatePackageVersion(packageJson: string, version: string): string {
  const data = JSON.parse(packageJson);
  const { indent } = detectIndent(packageJson);
  return _stringifyJson({ ...data, version }, indent);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _stringifyJson(data: any, indent: string | number): string {
  // We need to add a newline at the end so that Prettier will not complain about the new file.
  return JSON.stringify(data, null, indent).concat('\n');
}
