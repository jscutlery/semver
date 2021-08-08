export interface VersionBuilderSchema {
  dryRun?: boolean;
  noVerify?: boolean;
  push?: boolean;
  remote?: string;
  baseBranch?: string;
  syncVersions?: boolean;
  skipRootChangelog?: boolean;
  skipProjectChangelog?: boolean;
  version?: 'patch' | 'minor' | 'major' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease';
  preid?: string;
  changelogHeader?: string;
  versionTagPrefix?: string;
}
