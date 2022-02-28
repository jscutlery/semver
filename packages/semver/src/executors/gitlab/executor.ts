import { logger } from '@nrwl/devkit';
import { lastValueFrom, of } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';
import { ChildProcessResponse, execAsync } from '../common/exec-async';
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
  const createRelease$ = execAsync('release-cli', [
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
    catchError((response: ChildProcessResponse) => {
      logger.error(response.stderr);
      return of({ success: false });
    })
  );

  return lastValueFrom(createRelease$);
}
