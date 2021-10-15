import * as gitSemverTags from 'git-semver-tags';
import { from, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as semver from 'semver';
import { promisify } from 'util';

import type { Observable } from 'rxjs';

export function getLastVersion({
  tagPrefix,
}: {
  tagPrefix: string;
}): Observable<string> {
  return from(
    (promisify(gitSemverTags) as any)({ tagPrefix }) as Promise<string[]>
  ).pipe(
    switchMap((tags: string[]) => {
      const versions = tags.map((tag) => tag.substring(tagPrefix.length));
      const [version] = versions.sort(semver.rcompare);

      if (version == null) {
        return throwError(() => new Error('No semver tag found'));
      }

      const tag = `${tagPrefix}${version}`;
      return of(tag.substring(tagPrefix.length));
    })
  );
}
