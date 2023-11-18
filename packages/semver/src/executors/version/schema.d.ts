import type { Options as CommitParserOptions } from 'conventional-commits-parser';
import type { Preset } from '../common/preset';

export { CommitParserOptions };

export type ReleaseIdentifier =
  | 'patch'
  | 'minor'
  | 'major'
  | 'premajor'
  | 'preminor'
  | 'prepatch'
  | 'prerelease';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PresetOpt = Preset | Record<string, any>; // Custom preset, see: https://github.com/conventional-changelog/conventional-changelog-config-spec/blob/master/versions/2.2.0/README.md

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
  releaseAs?: ReleaseIdentifier;
  preid?: string;
  changelogHeader?: string;
  tagPrefix?: string | null;
  postTargets: string[];
  allowEmptyRelease?: boolean;
  skipCommitTypes?: string[];
  commitMessageFormat?: string;
  preset: PresetOpt | 'conventional'; // @TODO: Remove 'conventional' in the next major release.
  commitParserOptions?: CommitParserOptions;
}

export interface WriteChangelogConfig {
  changelogHeader: string;
  projectRoot: string;
  preset: PresetOpt;
  dryRun?: boolean;
  changelogPath: string;
  tagPrefix: string;
}
