import { readFile } from 'fs';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { promisify } from 'util';

export function readJsonFile(filePath: string) {
  return from(promisify(readFile)(filePath, 'utf-8')).pipe(
    map((data) => JSON.parse(data))
  );
}
