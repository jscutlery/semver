import { existsSync } from 'fs';
import { resolve } from 'path';
import { Observable } from 'rxjs';
import { readJsonFile } from './filesystem';

export function readPackageJson(
  projectRoot: string
): Observable<{
  version?: string;
}> {
  return readJsonFile(_getPackageJsonPath(projectRoot));
}

export function hasPackageJson(projectRoot: string) {
  return existsSync(_getPackageJsonPath(projectRoot));
}

export function _getPackageJsonPath(projectRoot: string) {
  return resolve(projectRoot, 'package.json');
}
