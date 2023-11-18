import type { Preset } from '../../executors/common/preset';

export interface SchemaOptions {
  syncVersions: boolean;
  baseBranch: string;
  projects?: string[];
  enforceConventionalCommits: boolean;
  skipInstall: boolean;
  commitMessageFormat?: string;
  preset: Preset;
}
