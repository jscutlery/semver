import { throwError, lastValueFrom } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';

import { execAsync } from '../common/exec-async';

import type { GithubExecutorSchema } from './schema';

export default async function runExecutor({
  tag,
  files,
  notes,
  notesFile,
  branch,
}: GithubExecutorSchema) {
  const createRelease$ = execAsync('gh release create', [
    tag,
    ...(files ? [files.toString()] : []),
    ...(notes ? [`--notes "${notes}"`] : []),
    ...(notesFile ? [`--notes-file ${notesFile}`] : []),
    ...(branch ? [`--branch ${branch}`] : []),
  ]).pipe(
    catchError((response) => throwError(() => new Error(response.error))),
    mapTo({ success: true })
  );

  return await lastValueFrom(createRelease$);
}
