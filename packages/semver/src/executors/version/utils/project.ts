import { resolve } from 'path';
import { map, of, switchMap, type Observable, concat, toArray } from 'rxjs';
import { readFileIfExists, readJsonFile, writeFile } from './filesystem';
import { logStep } from './logger';
import * as detectIndent from 'detect-indent';

export function readPackageJson(projectRoot: string): Observable<{
  version?: string;
}> {
  return readJsonFile(getPackageJsonPath(projectRoot));
}

export function getCustomJsonPath(projectRoot: string, jsonPath: string) {
  return resolve(projectRoot, jsonPath);
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

/**
 * Safely update multiple custom *.json files.
 */
export function updateCustomJsons({
  newVersion,
  projectRoot,
  projectName,
  customJsonPaths,
  dryRun,
}: {
  newVersion: string;
  projectRoot: string;
  projectName: string;
  customJsonPaths?: string[];
  dryRun: boolean;
}): Observable<(string | null)[]> {
  if (dryRun || !customJsonPaths) {
    return of([]);
  }

  return concat(
    ...customJsonPaths.map((customJsonPath) =>
      updateCustomJson({
        newVersion,
        projectRoot,
        projectName,
        customJsonPath,
        dryRun,
      })
    )
  ).pipe(toArray());
}

/**
 * Safely update custom *.json file.
 */
export function updateCustomJson({
  newVersion,
  projectRoot,
  projectName,
  customJsonPath,
  dryRun,
}: {
  newVersion: string;
  projectRoot: string;
  projectName: string;
  customJsonPath: string;
  dryRun: boolean;
}): Observable<string | null> {
  if (dryRun) {
    return of(null);
  }
  const [filePath, attrPath] = customJsonPath.split(':');
  const path = getCustomJsonPath(projectRoot, filePath);

  return readFileIfExists(path).pipe(
    switchMap((customJson) => {
      if (!customJson.length) {
        return of(null);
      }

      const newCustomJson = _updateCustomJsonVersion(
        customJson,
        attrPath,
        newVersion
      );

      return writeFile(path, newCustomJson).pipe(
        logStep({
          step: 'custom_json_success',
          message: `Updated ${filePath} version.`,
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

function _updateCustomJsonVersion(
  contentJson: string,
  attr: string,
  version: string
): string {
  const data = JSON.parse(contentJson);
  const { indent } = detectIndent(contentJson);
  const keys = attr.split('.');
  const patch = _createPatch(keys, version) as object;

  return _stringifyJson({ ...data, ...patch }, indent);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _stringifyJson(data: any, indent: string | number): string {
  // We need to add a newline at the end so that Prettier will not complain about the new file.
  return JSON.stringify(data, null, indent).concat('\n');
}

function _createPatch(attrPath: string[], version: string): string | object {
  const attr = attrPath.shift();
  if (attr) {
    return {
      [attr]: _createPatch(attrPath, version),
    };
  } else {
    return version;
  }
}
