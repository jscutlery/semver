import * as gitSemverTags from 'git-semver-tags';
import * as semver from 'semver';

export async function getLastVersion({
  tagPrefix,
  releaseType,
  preid,
}: {
  tagPrefix: string;
  releaseType?: semver.ReleaseType;
  preid?: string;
}): Promise<string> {
  const tags = await (gitSemverTags({ tagPrefix }) as Promise<string[]>);
  return getLastVersionFromTags({ tags, tagPrefix, preid });
}

function getLastVersionFromTags({
  tags,
  tagPrefix,
  preid,
}: {
  tags: string[];
  tagPrefix: string;
  preid?: string;
}): string {
  const versions = tags
    .map((tag) => tag.substring(tagPrefix.length))
    .filter((v) => {
      const prerelease = semver.prerelease(v);

      /* Filter-in all versions. */
      if (prerelease == null) {
        return true;
      }

      /* Filter-in all prereleases if no preid is specified. */
      if (preid == null) {
        return true;
      }

      /* Filter-in if preids match. */
      const [versionPreid] = prerelease;
      if (versionPreid === preid) {
        return true;
      }

      /* Filter-out only prereleases with different preids. */
      return false;
    });

  const [version] = versions.sort(semver.rcompare);

  if (version == null) {
    throw new Error('No semver tag found');
  }

  return version;
}
