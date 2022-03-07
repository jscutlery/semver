import * as fs from 'fs';
import { defer, of } from 'rxjs';
import { catchError, map, mapTo, switchMap } from 'rxjs/operators';

const fsPromises = fs.promises;

function exists(filePath: string) {
  return defer(() =>
    fsPromises.access(filePath, fs.constants.R_OK | fs.constants.W_OK)
  ).pipe(
    mapTo(true),
    catchError(() => of(false))
  );
}

function readFile(filePath: string) {
  return defer(() => fsPromises.readFile(filePath, { encoding: 'utf-8' }));
}

export function readFileIfExists(filePath: string, fallback = '') {
  return exists(filePath).pipe(
    switchMap((exist) => (exist ? readFile(filePath) : of(fallback)))
  );
}

export function readJsonFile(filePath: string) {
  return readFile(filePath).pipe(map((data) => JSON.parse(data)));
}
