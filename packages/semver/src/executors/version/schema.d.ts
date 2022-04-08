export type ReleaseIdentifier =
  | 'patch'
  | 'minor'
  | 'major'
  | 'premajor'
  | 'preminor'
  | 'prepatch'
  | 'prerelease';

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
  /**
   * @deprecated
   * @sunset 3.0.0
   */
  syncVersions?: boolean;
  skipRootChangelog?: boolean;
  skipProjectChangelog?: boolean;
  trackDeps?: boolean;
  /**
   * @deprecated Use the alias releaseAs (--releaseAs) instead.
   * @sunset 3.0.0
   */
  version?: ReleaseIdentifier;
  releaseAs?: ReleaseIdentifier;
  preid?: string;
  changelogHeader?: string;
  tagPrefix?: string | null;
  /**
   * @deprecated Use the alias tagPrefix (--tagPrefix) instead.
   * @sunset 3.0.0
   */
  versionTagPrefix?: string | null;
  postTargets: string[];
  allowEmptyRelease?: boolean;
  commitMessageFormat?: string;
  preset: 'angular' | 'conventional';
}
