import { TargetConfiguration } from "@nrwl/devkit";

export type ReleaseIdentifier = 'patch' | 'minor' | 'major' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease';

/**
 * Specify a target to run after a new version was successfully created.
 * @example "@jscutlery/semver:push"
 * @example { "executor": "@jscutlery/semver:push", "options": {...} }
 */
export type PostTargetSchema = string | Pick<TargetConfiguration, 'executor' | 'options'>;

export interface VersionBuilderSchema {
  dryRun?: boolean;
  noVerify?: boolean;
  /**
   * @deprecated Use postTargets instead.
   * @sunset 3.0.0
   */
  push?: boolean;
  remote?: string;
  baseBranch?: string;
  syncVersions?: boolean;
  skipRootChangelog?: boolean;
  skipProjectChangelog?: boolean;
  /**
   * @deprecated Use the alias releaseAs (--releaseAs) instead.
   * @sunset 3.0.0
   */
  version?: ReleaseIdentifier;
  releaseAs?: ReleaseIdentifier;
  preid?: string;
  changelogHeader?: string;
  versionTagPrefix?: string;
  postTargets: PostTargetSchema[];
}
