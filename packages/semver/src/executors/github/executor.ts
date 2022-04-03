import { logger } from '@nrwl/devkit';
import { lastValueFrom, of } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';

import { exec } from '../common/exec';

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
  const createRelease$ = exec('gh', [
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
    mapTo({ success: true }),
    catchError((response) => {
      logger.error(response);
      return of({ success: false });
    }),
  );

  return lastValueFrom(createRelease$);
}
