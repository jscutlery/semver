import { logger } from '@nrwl/devkit';
import { catchError, mapTo } from 'rxjs/operators';
import { of } from 'rxjs';

import { execAsync } from '../common/exec-async';

import type { GithubExecutorSchema } from './schema';

export default async function runExecutor({
  tag,
  files,
  branch,
}: GithubExecutorSchema) {
  return execAsync('gh release create', [
    tag,
    ...(files ? files : []),
    ...(branch ? [`--branch ${branch}`] : []),
  ])
    .pipe(
      mapTo({ success: true }),
      catchError((error) => {
        logger.error(error.stack ?? error.toString());
        return of({ success: false });
      })
    )
    .toPromise();
}
