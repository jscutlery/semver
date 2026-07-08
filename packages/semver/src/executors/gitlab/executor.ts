import { logger } from '@nx/devkit';
import { exec } from '../common/exec';
import type { GitLabReleaseSchema } from './schema';

export default async function runExecutor({
  tag,
  ref,
  assets,
  description,
  milestones,
  name,
  releasedAt,
}: GitLabReleaseSchema) {
  try {
    await exec('release-cli', [
      'create',
      ...['--tag-name', tag],
      ...(name ? ['--name', name] : []),
      ...(description ? ['--description', description] : []),
      ...(milestones
        ? milestones.map((milestone) => ['--milestone', milestone]).flat()
        : []),
      ...(releasedAt ? ['--released-at', releasedAt] : []),
      ...(ref ? ['--ref', ref] : []),
      ...(assets
        ? assets
            .map((asset) => [
              '--assets-link',
              `{"name": "${asset.name}", "url": "${asset.url}"}`,
            ])
            .flat()
        : []),
    ]);

    return { success: true };
  } catch (response) {
    logger.error(response);
    return { success: false };
  }
}
