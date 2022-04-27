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
}: {
  newVersion: string;
  projectRoot: string;
  projectName: string;
}): Observable<string | null> {
  const packageJsonPath = getPackageJsonPath(projectRoot);
  return readFileIfExists(packageJsonPath).pipe(
    switchMap((packageJson) => {
      if (packageJson.length) {
        const newPackageJson = JSON.parse(packageJson);
        newPackageJson.version = newVersion;

        return writeFile(
          packageJsonPath,
          JSON.stringify(newPackageJson, null, 2)
        ).pipe(
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
