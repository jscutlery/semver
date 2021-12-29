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
  draft,
  title,
  prerelease,
  discussionCategory,
  repo,
}: GithubExecutorSchema) {
  const createRelease$ = execAsync('gh', [
    'release',
    'create',
    tag,
    ...(files ? [files.toString()] : []),
    ...(notes ? ['--notes', notes] : []),
    ...(notesFile ? ['--notes-file', notesFile] : []),
    ...(branch ? ['--branch', branch] : []),
    ...(draft ? ['--draft'] : []),
    ...(title ? ['--title', title] : []),
    ...(prerelease ? ['--prerelease'] : []),
    ...(discussionCategory
      ? [`--discussion-category`, discussionCategory]
      : []),
    ...(repo ? [`--repo`, repo] : []),
  ]).pipe(
    catchError((response) => throwError(() => new Error(response.error))),
    mapTo({ success: true })
  );

  return lastValueFrom(createRelease$);
}
