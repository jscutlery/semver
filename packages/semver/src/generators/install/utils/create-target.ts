import type { TargetConfiguration } from '@nx/devkit';
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
  const targetOptions = [
    'syncVersions',
    'baseBranch',
    'preset',
    'commitMessageFormat',
  ] as const;

  return targetOptions
    .filter((key) => Boolean(options[key]))
    .reduce(
      (targetOptions, key) => ({
        ...targetOptions,
        [key]: options[key as keyof SchemaOptions],
      }),
      {}
    );
}
