import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { defer } from 'rxjs';
import * as standardVersionDefaults from 'standard-version/defaults';
import * as changelog from 'standard-version/lib/lifecycles/changelog';
import { promisify } from 'util';
import { defaultHeader } from './utils/changelog';

export function getChangelogPath(projectRoot: string) {
  return resolve(projectRoot, 'CHANGELOG.md');
}

export function hasChangelog(projectRoot: string) {
  return existsSync(getChangelogPath(projectRoot));
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
