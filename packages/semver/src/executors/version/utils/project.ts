import { resolve } from 'path';
import { map, of, switchMap, type Observable } from 'rxjs';
import { readFileIfExists, readJsonFile, writeFile } from './filesystem';

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
}: {
  newVersion: string;
  projectRoot: string;
}): Observable<string> {
  const packageJsonPath = getPackageJsonPath(projectRoot);
  return readFileIfExists(packageJsonPath).pipe(
    switchMap((packageJson) => {
      if (packageJson.length) {
        const newPackageJson = JSON.parse(packageJson);
        newPackageJson.version = newVersion;

        return writeFile(
          packageJsonPath,
          JSON.stringify(newPackageJson, null, 2)
        ).pipe(map(() => packageJsonPath));
      }

      return of(packageJsonPath);
    })
  );
}
