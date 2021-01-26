import * as gitSemverTags from 'git-semver-tags';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as semver from 'semver';
import { promisify } from 'util';
import { hasPackageJson, readPackageJson } from './project';

export const defaultTag = 'v';

/**
 * This is inspired from standard-version implementation but in this case
 * we handle the tagPrefix properly and the default value is 0.0.0 instead
 * of 1.0.0.
 *
 * Cf. https://github.com/conventional-changelog/standard-version/blob/master/lib/latest-semver-tag.js
 */
export function getCurrentVersion({
  projectRoot,
  tagPrefix = defaultTag,
}: {
  projectRoot: string;
  tagPrefix?: string;
}): Observable<string> {
  /* Use `package.json` by default. */
  if (hasPackageJson(projectRoot)) {
    return readPackageJson(projectRoot).pipe(
      map((packageInfo) => packageInfo.version as string)
    );
  }

  /* Fallback to git tags. */
  return from(promisify(gitSemverTags)({ tagPrefix })).pipe(
    map((tags: string[]) => {
      const versions = tags
        .map((tag) => tag.substring(tagPrefix.length))
        .sort(semver.rcompare);

      /* Fallback to default value. */
      return versions[0] || '0.0.0';
    })
  );
}
