import * as gitSemverTags from 'git-semver-tags';
import * as semver from 'semver';
import { promisify } from 'util';

/**
 * @internal
 */
export async function getLastVersion({
  tagPrefix,
}: {
  tagPrefix: string;
}): Promise<string> {
  const getSemverTags = promisify(gitSemverTags) as (
    options: gitSemverTags.Options
  ) => Promise<string[]>;
  const tags = await getSemverTags({ tagPrefix });
  const versions = tags.map((tag) => tag.substring(tagPrefix.length));
  const [version] = versions.sort(semver.rcompare);

  if (version == null) {
    throw new Error('No semver tag found');
  }

  const tag = `${tagPrefix}${version}`;
  return tag.substring(tagPrefix.length);
}
