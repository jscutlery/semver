import { resolve } from 'path';
import { map, of, switchMap, type Observable } from 'rxjs';
import { readFileIfExists, readJsonFile, writeFile } from './filesystem';
import { logStep } from './logger';

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

  const packageJsonPath = getPackageJsonPath(projectRoot);
  return readFileIfExists(packageJsonPath).pipe(
    switchMap((packageJson) => {
      if (packageJson.length) {
        const newPackageJson = JSON.parse(packageJson);
        newPackageJson.version = newVersion;

        const newPackageJsonString = JSON.stringify(newPackageJson, null, 2);
        // We need to add a newline at the end so that Prettier will not complain about the new
        // file.
        const data = newPackageJsonString.concat('\n');
        return writeFile(packageJsonPath, data).pipe(
          logStep({
            step: 'package_json_success',
            message: `Updated package.json version.`,
            projectName,
          }),
          map(() => packageJsonPath)
        );
      }

      return of(null);
    })
  );
}
