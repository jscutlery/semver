import { logging } from '@angular-devkit/core';
import * as gitSemverTags from 'git-semver-tags';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import * as semver from 'semver';
import { promisify } from 'util';

import { getLastTag } from './git';

export function getLastSemverTag({
  tagPrefix,
}: {
  tagPrefix: string;
}): Observable<string> {
  return from(promisify(gitSemverTags)({ tagPrefix })).pipe(
    switchMap((tags: string[]) => {
      const [version] = tags.sort(semver.rcompare);

      if (version == null) {
        return throwError(new Error('No semver tag found'));
      }

      return of(version);
    })
  );
}

export const defaultTag = 'v';

/**
 * Returns a valid git tag that we can use as a ref for version comparison.
 * Otherwise it returns '0.0.0'.
 */
export function getCurrentVersion({
  logger,
  tagPrefix = defaultTag,
}: {
  logger: logging.LoggerApi;
  tagPrefix?: string;
}): Observable<string> {
  /* Get last semver tags. */
  return getLastSemverTag({ tagPrefix }).pipe(
    /* Fallback to last Git tag. */
    catchError(() =>
      getLastTag().pipe(
        tap((tag) => {
          logger.warn(`🟠 No previous semver tag found, fallback from: ${tag}`);
        })
      )
    ),

    /* Fallback to 0.0.0 */
    catchError(() => {
      logger.warn(
        '🟠 No previous tag found, fallback to version 0.0.0'
      );
      return of('0.0.0');
    })
  );
}
