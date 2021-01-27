import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { defer } from 'rxjs';
import { promisify } from 'util';
import * as changelog from 'standard-version/lib/lifecycles/changelog';
import * as standardVersionDefaults from 'standard-version/defaults';

export const defaultHeader = `# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).
`;

export function getChangelogPath(projectRoot: string) {
  return resolve(projectRoot, 'CHANGELOG.md');
}

export function updateChangelog({
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
  return defer(async () => {
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
    if (!dryRun) {
      await promisify(execFile)('git', ['add', changelogPath]);
    }
  });
}
