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
      ...resolvePresetOptions(config),
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

function resolvePresetOptions(config: WriteChangelogConfig) {
  if (typeof config.preset === 'string') {
    return { preset: config.preset };
  }

  if (!config.preset.name) {
    return { config: config.preset };
  }

  return {
    preset: config.preset.name ?? 'conventionalcommits',
    config: config.preset,
  };
}
