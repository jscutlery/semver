import { WriteChangelogConfig } from '../schema';
import * as conventionalChangelog from 'conventional-changelog';

export function initConventionalCommitReadableStream(
  config: WriteChangelogConfig,
  newVersion: string
) {
  const context = { version: newVersion };
  return conventionalChangelog(
    {
      preset: config.preset,
      tagPrefix: config.tagPrefix,
    },
    context,
    { merges: null, path: config.projectRoot } as conventionalChangelog.Options
  );
}
