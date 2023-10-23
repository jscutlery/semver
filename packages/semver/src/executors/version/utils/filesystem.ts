import * as fs from 'fs';
import { defer, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

const fsPromises = fs.promises;

/* istanbul ignore next */
export function exists(filePath: string) {
  return defer(() =>
    fsPromises.access(filePath, fs.constants.R_OK | fs.constants.W_OK),
  ).pipe(
    map(() => true),
    catchError(() => of(false)),
  );
}

export function readFile(filePath: string) {
  return defer(() => fsPromises.readFile(filePath, { encoding: 'utf-8' }));
}

export function readFileIfExists(filePath: string, fallback = '') {
  return exists(filePath).pipe(
    switchMap((exist) => (exist ? readFile(filePath) : of(fallback))),
  );
}

export function readJsonFile(filePath: string) {
  return readFile(filePath).pipe(map((data) => JSON.parse(data)));
}

/* istanbul ignore next */
export function writeFile(
  filePath: string,
  data: Parameters<typeof fsPromises.writeFile>[1],
): Observable<void> {
  return defer(() =>
    fsPromises.writeFile(filePath, data, { encoding: 'utf-8' }),
  );
}
