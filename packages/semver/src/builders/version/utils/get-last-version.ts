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
  const tags = await promisify(gitSemverTags)({ tagPrefix });
  const versions = tags.map((tag) => tag.substring(tagPrefix.length));
  const [version] = versions.sort(semver.rcompare);

  if (version == null) {
    throw new Error('No semver tag found');
  }

  const tag = `${tagPrefix}${version}`;
  return tag.substring(tagPrefix.length);
}
