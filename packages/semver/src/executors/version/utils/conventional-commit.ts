import * as conventionalChangelog from 'conventional-changelog';
import { WriteChangelogConfig } from '../schema';

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
        path: config.projectRoot,
      },
    },
    { version: newVersion },
    /// @ts-expect-error - Partially typed API
    { path: config.projectRoot },
  );
}
