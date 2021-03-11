import * as gitSemverTags from 'git-semver-tags';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import * as semver from 'semver';
import { promisify } from 'util';

import { getLastTag } from './git';

export function getLastSemverTag(tagPrefix: string): Observable<string> {
  return from(promisify(gitSemverTags)({ tagPrefix })).pipe(
    switchMap((tags: string[]) => {
      const [version] = tags
        .map((tag) => tag.substring(tagPrefix.length))
        .sort(semver.rcompare);

      if (version == null) {
        return throwError(new Error('No semver tag found'));
      }

      return of(version);
    })
  );
}

export const defaultTag = 'v';

export function getCurrentVersion({
  tagPrefix = defaultTag,
}: {
  tagPrefix?: string;
}): Observable<string> {
  /* Get last semver tags. */
  return getLastSemverTag(tagPrefix).pipe(
    /* Fallback to last Git tag. */
    catchError(() => getLastTag()),

    /* Fallback to 0.0.0 */
    catchError(() => {
      console.warn('🟠 No tag found, fallback to version 0.0.0');

      return of('0.0.0');
    })
  );
}
