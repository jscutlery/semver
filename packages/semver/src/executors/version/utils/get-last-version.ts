import * as gitSemverTags from 'git-semver-tags';
import { from, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as semver from 'semver';
import type { Observable } from 'rxjs';

export function getLastVersion({
  tagPrefix,
  releaseType,
  preid,
}: {
  tagPrefix: string;
  releaseType?: semver.ReleaseType;
  preid?: string;
}): Observable<string> {
  return from(gitSemverTags({ tagPrefix }) as Promise<string[]>).pipe(
    switchMap((tags) => {
      const versions = tags
        .map((tag) => tag.substring(tagPrefix.length))
        .filter((v) => {
          const prerelease = semver.prerelease(v);

          /* Filter-in everything except prereleases. */
          if (prerelease == null) {
            return true;
          }

          /* Filter-in everything if preid is not set. */
          if (releaseType && preid == null) {
            return true;
          }

          /* Filter-in if preids match. */
          const [versionPreid] = prerelease;
          if (releaseType && versionPreid === preid) {
            return true;
          }

          /* Filter-out everything else.*/
          return false;
        });

      const [version] = versions.sort(semver.rcompare);

      if (version == null) {
        return throwError(() => new Error('No semver tag found'));
      }

      return of(version);
    }),
  );
}
