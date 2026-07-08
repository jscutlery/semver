import { logger } from '@nx/devkit';
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
  notesStartTag,
}: GithubExecutorSchema) {
  try {
    await exec('gh', [
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
      ...(notesStartTag ? [`--notes-start-tag`, notesStartTag] : []),
    ]);

    return { success: true };
  } catch (response) {
    logger.error(response);
    return { success: false };
  }
}
