import { resolve } from 'path';
import { combineLatestWith, concatMap, defer, lastValueFrom, OperatorFunction } from 'rxjs';
import * as standardVersionDefaults from 'standard-version/defaults';
import * as changelog from 'standard-version/lib/lifecycles/changelog';

import { diff } from './diff';
import { readFileIfExists } from './filesystem';

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
    return changelogPath;
  });
}

export function calculateChangelogChanges<T>({
  changelogPath,
  changelogHeader,
}: {
  changelogPath: string;
  changelogHeader: string;
}): OperatorFunction<T, string> {
  return (source) => {
    return readFileIfExists(changelogPath, changelogHeader).pipe(
      combineLatestWith(source),
      concatMap(async ([input]) => {
        const output = await lastValueFrom(
          readFileIfExists(changelogPath, changelogHeader)
        );

        return diff(input, output);
      })
    );
  };
}
