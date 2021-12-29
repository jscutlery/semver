import { logger } from '@nrwl/devkit';
import { throwError, lastValueFrom } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';

import { execAsync } from '../common/exec-async';

import type { GithubExecutorSchema } from './schema';

export default async function runExecutor({
  tag,
  files,
  notes,
  notesFile,
  target,
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
    ...(target ? ['--target', target] : []),
    ...(draft ? ['--draft'] : []),
    ...(title ? ['--title', title] : []),
    ...(prerelease ? ['--prerelease'] : []),
    ...(discussionCategory
      ? [`--discussion-category`, discussionCategory]
      : []),
    ...(repo ? [`--repo`, repo] : []),
    ...(generateNotes ? [`--generate-notes`] : []),
  ]).pipe(
    catchError((response) => throwError(() => {
      logger.error(response.stderr);
      return throwError(() => new Error(response.stderr))
    })),
    mapTo({ success: true })
  );

  return lastValueFrom(createRelease$);
}
