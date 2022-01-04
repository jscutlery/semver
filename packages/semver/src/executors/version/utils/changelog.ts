import { readFile, writeFile } from 'fs';
import { resolve } from 'path';
import {
  combineLatestWith,
  concatMap,
  defer,
  lastValueFrom,
  OperatorFunction,
} from 'rxjs';
import * as standardVersionDefaults from 'standard-version/defaults';
import * as changelog from 'standard-version/lib/lifecycles/changelog';
import { promisify } from 'util';
import { Version } from '../version';

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
  changelogHeader,
  tagPrefix,
}: {
  projectRoot: string;
  dryRun: boolean;
  preset: string;
  newVersion: string;
  changelogHeader?: string;
  tagPrefix?: string;
}) {
  return defer(async () => {
    const changelogPath = resolve(projectRoot, 'CHANGELOG.md');
    await changelog(
      {
        ...standardVersionDefaults,
        header: changelogHeader || defaultHeader,
        path: projectRoot,
        preset,
        dryRun,
        infile: changelogPath,
        tagPrefix,
      },
      newVersion
    );
    return changelogPath;
  });
}

export function insertChangelogDepedencyUpdates({
  changelogPath,
  version,
  dryRun,
  dependencyUpdates,
}: {
  changelogPath: string;
  version: string;
  dryRun: boolean;
  dependencyUpdates: Version[];
}) {
  return defer(async () => {
    if (!dependencyUpdates.length || dryRun) return changelogPath;

    let changelog = await promisify(readFile)(changelogPath, 'utf-8');

    const match = changelog.match(
      new RegExp(`##? \\[?${version}\\]? ?\\(.*\\)`)
    );

    if (match && match.index !== undefined) {
      const dependencyNames = dependencyUpdates.reduce((acc, ver) => {
        if (ver.type === 'dependency') {
          acc.push(
            `* \`${ver.dependencyName}\` updated to version \`${ver.version}\``
          );
        }
        return acc;
      }, [] as string[]);

      changelog =
        `${changelog.substring(0, match.index + match[0].length)}` +
        `\n\n### Dependency Updates\n\n${dependencyNames.join('\n')}\n` +
        `${changelog.substring(match.index + match[0].length + 2)}`;

      await promisify(writeFile)(changelogPath, changelog, 'utf-8');
    }
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
