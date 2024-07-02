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
  allowEmptyRelease?: boolean;
  baseBranch?: string;
  changelogHeader?: string;
  commitMessageFormat?: string;
  commitParserOptions?: CommitParserOptions;
  dryRun?: boolean;
  noVerify?: boolean;
  postTargets: string[];
  preid?: string;
  preset: PresetOpt | 'conventional'; // @TODO: Remove 'conventional' in the next major release.
  push?: boolean;
  releaseAs?: ReleaseIdentifier;
  remote?: string;
  skipCommit?: boolean;
  skipCommitTypes?: string[];
  skipProjectChangelog?: boolean;
  skipRootChangelog?: boolean;
  syncVersions?: boolean;
  tagPrefix?: string | null;
  trackDeps?: boolean;
  trackDepsWithReleaseAs?: boolean;
}

export interface WriteChangelogConfig {
  changelogHeader: string;
  projectRoot: string;
  preset: PresetOpt;
  dryRun?: boolean;
  changelogPath: string;
  tagPrefix: string;
}
