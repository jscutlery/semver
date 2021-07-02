import * as standardVersionDefaults from 'standard-version/defaults';
import * as changelog from 'standard-version/lib/lifecycles/changelog';

import { getChangelogPath } from './workspace';

export const defaultHeader = `# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).
`;

/**
 * @internal
 */
export async function updateChangelog({
  projectRoot,
  dryRun,
  preset,
  newVersion,
}: {
  projectRoot: string;
  dryRun: boolean;
  preset: string;
  newVersion: string;
}) {
  const changelogPath = getChangelogPath(projectRoot);
  await changelog(
    {
      ...standardVersionDefaults,
      header: defaultHeader,
      path: projectRoot,
      preset,
      dryRun,
      infile: changelogPath,
    },
    newVersion
  );
  return changelogPath;
}
