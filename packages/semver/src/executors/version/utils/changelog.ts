import { resolve } from 'path';
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
export async function updateChangelog({
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
}): Promise<string> {
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
}

/* istanbul ignore next */
export async function insertChangelogDependencyUpdates({
  changelogPath,
  version,
  dryRun,
  dependencyUpdates,
}: {
  changelogPath: string;
  version: string;
  dryRun: boolean;
  dependencyUpdates: Version[];
}): Promise<string> {
  const skipDependencyUpdates = !dependencyUpdates.length || dryRun;

  if (skipDependencyUpdates) {
    return changelogPath;
  }

  const changelog = _calculateDependencyUpdates({
    changelog: await readFile(changelogPath),
    version,
    dependencyUpdates,
  });

  await writeFile(changelogPath, changelog);

  return changelogPath;
}

/* istanbul ignore next */
export async function calculateChangelogChanges<T>({
  changelogPath,
  changelogHeader,
  run,
}: {
  changelogPath: string;
  changelogHeader: string;
  run: () => Promise<T>;
}): Promise<{ result: T; notes: string }> {
  const input = await readFileIfExists(changelogPath, changelogHeader);
  const result = await run();
  const output = await readFileIfExists(changelogPath, changelogHeader);

  return { result, notes: diff(input, output) };
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

    const headerEnd = match.index + match[0].length;
    const rest = changelog.substring(headerEnd).replace(/^\n+/, '');

    changelog =
      `${changelog.substring(0, headerEnd)}` +
      `\n\n### Dependency Updates\n\n${dependencyNames.join('\n')}\n\n` +
      rest;
  }

  return changelog;
}
