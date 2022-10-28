import ConventionalChangelogConfigSpec from '@types/conventional-changelog-config-spec';
export type ReleaseIdentifier =
  | 'patch'
  | 'minor'
  | 'major'
  | 'premajor'
  | 'preminor'
  | 'prepatch'
  | 'prerelease';

export type Preset =
  | 'angular'
  | 'conventional'
  | ({ name: string } & ConventionalChangelogConfigSpec.Config);

export interface VersionBuilderSchema {
  dryRun?: boolean;
  noVerify?: boolean;
  push?: boolean;
  remote?: string;
  baseBranch?: string;
  syncVersions?: boolean;
  skipRootChangelog?: boolean;
  skipProjectChangelog?: boolean;
  trackDeps?: boolean;
  skipCommit?: boolean;
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
  skipCommitTypes?: string[];
  commitMessageFormat?: string;
  preset: Preset;
}

export interface WriteChangelogConfig {
  header: string;
  path?: string;
  preset?: Preset;
  dryRun?: boolean;
  silent?: boolean;
  infile: string;
  tagPrefix?: string;
}
