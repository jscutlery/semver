import * as fs from 'fs';
import { defer, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { promisify } from 'util';

function exists(filePath: string) {
  return defer(() => promisify(fs.exists)(filePath))
}

function readFile(filePath: string) {
  return defer(() => promisify(fs.readFile)(filePath, 'utf-8'))
}

export function readFileIfExists(filePath: string, fallback = '') {
  return exists(filePath).pipe(
    switchMap((exist) => (exist ? readFile(filePath) : of(fallback)))
  )
}

export function readJsonFile(filePath: string) {
  return readFile(filePath).pipe(
    map((data) => JSON.parse(data))
  );
}
