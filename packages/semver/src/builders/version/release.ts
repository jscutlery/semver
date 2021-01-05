import * as standardVersion from 'standard-version';

export function release(config: standardVersion.Options): Promise<void> {
  return standardVersion(config);
}
