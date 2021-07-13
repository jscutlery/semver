import { readFile } from 'fs';
import { defer } from 'rxjs';
import { map } from 'rxjs/operators';
import { promisify } from 'util';

export function readJsonFile(filePath: string) {
  return defer(() => promisify(readFile)(filePath, 'utf-8')).pipe(
    map((data) => JSON.parse(data))
  );
}
