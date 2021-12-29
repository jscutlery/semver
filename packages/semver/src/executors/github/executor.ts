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
  generateNotes,
}: GithubExecutorSchema) {
  const createRelease$ = execAsync('gh', [
    'release',
    'create',
    tag,
    ...(files ? files : []),
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
    ...(generateNotes ? [`--generate-notes`] : []),
  ]).pipe(
    catchError((response) => throwError(() => new Error(response.error))),
    mapTo({ success: true })
  );

  return lastValueFrom(createRelease$);
}
