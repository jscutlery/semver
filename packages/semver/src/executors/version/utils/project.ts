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
 * Returns null if package.json does not exist.
 * Returns package.json path if successfully updated.
 */
export function updatePackageJson({
  newVersion,
  projectRoot,
}: {
  newVersion: string;
  projectRoot: string;
}): Observable<string | null> {
  const packageJsonPath = getPackageJsonPath(projectRoot);
  return readFileIfExists(packageJsonPath).pipe(
    switchMap((packageJson) => {
      if (packageJson.length) {
        const newPackageJson = JSON.parse(packageJson);
        newPackageJson.version = newVersion;

        return writeFile(packageJsonPath, newPackageJson).pipe(
          map(() => packageJsonPath)
        );
      }

      return of(null);
    })
  );
}
