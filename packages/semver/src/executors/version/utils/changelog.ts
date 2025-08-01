import { resolve } from 'path';
import {
  combineLatestWith,
  concatMap,
  defer,
  lastValueFrom,
  map,
  of,
  switchMap,
  type Observable,
  type OperatorFunction,
} from 'rxjs';
import writeChangelog from './write-changelog';
import type { Version } from '../version';
import { diff } from './diff';
import { readFile, readFileIfExists, writeFile } from './filesystem';
import { PresetOpt } from '../schema';
import { Options as CommitParserOptions } from 'conventional-commits-parser';
export const defaultHeader = `# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).
`;

/* istanbul ignore next */
export function getChangelogPath(projectRoot: string) {
  return resolve(projectRoot, 'CHANGELOG.md');
}

/* istanbul ignore next */
export function updateChangelog({
  projectRoot,
  dryRun,
  preset,
  newVersion,
  changelogHeader,
  tagPrefix,
  commitParserOptions,
}: {
  projectRoot: string;
  dryRun: boolean;
  preset: PresetOpt;
  newVersion: string;
  tagPrefix: string;
  changelogHeader: string;
  commitParserOptions?: CommitParserOptions;
}): Observable<string> {
  return defer(async () => {
    const changelogPath = getChangelogPath(projectRoot);
    await writeChangelog(
      {
        changelogHeader,
        changelogPath,
        dryRun,
        projectRoot,
        preset,
        tagPrefix,
        commitParserOptions,
      },
      newVersion,
    );
    return changelogPath;
  });
}

/* istanbul ignore next */
export function insertChangelogDependencyUpdates({
  changelogPath,
  version,
  dryRun,
  dependencyUpdates,
}: {
  changelogPath: string;
  version: string;
  dryRun: boolean;
  dependencyUpdates: Version[];
}): Observable<string> {
  return of(!dependencyUpdates.length || dryRun).pipe(
    switchMap((skipDependencyUpdates) => {
      if (skipDependencyUpdates) {
        return of(changelogPath);
      }

      return readFile(changelogPath).pipe(
        map((changelog) =>
          _calculateDependencyUpdates({
            changelog,
            version,
            dependencyUpdates,
          }),
        ),
        switchMap((changelog) => writeFile(changelogPath, changelog)),
        map(() => changelogPath),
      );
    }),
  );
}

/* istanbul ignore next */
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
          readFileIfExists(changelogPath, changelogHeader),
        );

        return diff(input, output);
      }),
    );
  };
}

/* istanbul ignore next */
export function _calculateDependencyUpdates({
  changelog,
  version,
  dependencyUpdates,
}: {
  changelog: string;
  version: string;
  dependencyUpdates: Version[];
}): string {
  const match = changelog.match(new RegExp(`##? \\[?${version}\\]? ?\\(.*\\)`));

  if (match && match.index !== undefined) {
    const dependencyNames = dependencyUpdates.reduce((acc, ver) => {
      if (ver.type === 'dependency') {
        acc.push(
          `* \`${ver.dependencyName}\` updated to version \`${ver.version}\``,
        );
      }
      return acc;
    }, [] as string[]);

    changelog =
      `${changelog.substring(0, match.index + match[0].length)}` +
      `\n\n### Dependency Updates\n\n${dependencyNames.join('\n')}\n` +
      `${changelog.substring(match.index + match[0].length + 2)}`;
  }

  return changelog;
}
