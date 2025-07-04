import * as path from 'node:path';
import * as conventionalChangelog from 'conventional-changelog';
import { WriteChangelogConfig } from '../schema';

/* istanbul ignore next */
export function createConventionalCommitStream(
  config: WriteChangelogConfig,
  newVersion: string,
) {
  return conventionalChangelog(
    {
      ...(typeof config.preset === 'string' ? { preset: config.preset } : {}),
      ...(typeof config.preset === 'object' ? { config: config.preset } : {}),
      tagPrefix: config.tagPrefix,
      pkg: {
        path: path.join(config.projectRoot, 'package.json'),
      },
    },
    { version: newVersion },
    /// @ts-expect-error - Partially typed API
    { path: config.projectRoot },
    config.commitParserOptions,
  );
}
