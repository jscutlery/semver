import { logger } from '@nrwl/devkit';
import { lastValueFrom, of } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';

import { ChildProcessResponse, execAsync } from '../common/exec-async';

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
    mapTo({ success: true }),
    catchError((response: ChildProcessResponse) => {
      logger.error(response.stderr);
      return of({ success: false });
    }),
  );

  return lastValueFrom(createRelease$);
}
