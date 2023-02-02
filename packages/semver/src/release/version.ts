import * as semver from 'semver';
import { getTags } from './tag';

export async function getCurrentVersion({
  tagPrefix,
}: {
  tagPrefix: string;
}): Promise<string> {
  const initialVersion = '0.0.0';
  const versions = (await getTags())
    .filter((tag) => tag.startsWith(tagPrefix))
    .map((tag) => tag.substring(tagPrefix.length))
    .filter((tag) => semver.valid(tag) != null);

  const [version] = versions.sort(semver.rcompare);

  if (version == null) {
    return initialVersion;
  }

  return version;
}
