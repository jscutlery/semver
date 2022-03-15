import type { TargetConfiguration } from '@nrwl/devkit';

import type { SchemaOptions } from '../schema';

/* istanbul ignore next */
export function createTarget(options: SchemaOptions): TargetConfiguration {
  const targetOptions = _createOptions(options);
  return {
    executor: '@jscutlery/semver:version',
    ...(Object.keys(targetOptions).length > 0
      ? { options: targetOptions }
      : {}),
  };
}

/* istanbul ignore next */
export function _createOptions(
  options: SchemaOptions
): TargetConfiguration['options'] {
  const targetOptions: Record<string, unknown> = {};

  if (options.syncVersions) {
    targetOptions.syncVersions = options.syncVersions;
  }

  if (options.baseBranch) {
    targetOptions.baseBranch = options.baseBranch;
  }

  if (options.preset) {
    targetOptions.preset = options.preset;
  }

  /* @notice: to avoid breaking old users, default --commitMessageFormat option is set for new users in the install generator
  but should be set in the executor for the next major 3.0.0 */
  if (options.commitMessageFormat) {
    targetOptions.commitMessageFormat = options.commitMessageFormat;
  }

  return targetOptions;
}
