import { logger } from '@nrwl/devkit';
import { lastValueFrom, of } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';
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
  const createRelease$ = exec('release-cli', [
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
      ? assets.map(
          (asset) =>
            `--assets-link='{"name": "${asset.name}", "url": "${asset.url}"}'`
        )
      : []),
  ]).pipe(
    mapTo({ success: true }),
    catchError((response) => {
      logger.error(response);
      return of({ success: false });
    })
  );

  return lastValueFrom(createRelease$);
}
