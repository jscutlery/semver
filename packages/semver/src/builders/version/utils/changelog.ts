import { resolve } from 'path';
import { defer } from 'rxjs';
import * as changelog from 'standard-version/lib/lifecycles/changelog';
import * as standardVersionDefaults from 'standard-version/defaults';

export const defaultHeader = `# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).
`;

/**
 * @internal
 */
export function getChangelogPath(projectRoot: string) {
  return resolve(projectRoot, 'CHANGELOG.md');
}

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
  const changelogPath = resolve(projectRoot, 'CHANGELOG.md');
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
