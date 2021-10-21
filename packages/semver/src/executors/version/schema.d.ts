export type ReleaseIdentifier = 'patch' | 'minor' | 'major' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease';

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
  useDeps?: boolean;
  /**
   * @deprecated Use the alias releaseAs (--releaseAs) instead.
   * @sunset 3.0.0
   */
  version?: ReleaseIdentifier;
  releaseAs?: ReleaseIdentifier;
  preid?: string;
  changelogHeader?: string;
  versionTagPrefix?: string;
  postTargets: string[];
}
