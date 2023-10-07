import ConventionalChangelogConfigSpec from '@types/conventional-changelog-config-spec';
import type { Options as CommitParserOptions } from 'conventional-commits-parser';

export { CommitParserOptions };

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
  | 'conventionalcommits'
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
  releaseAs?: ReleaseIdentifier;
  preid?: string;
  changelogHeader?: string;
  tagPrefix?: string | null;
  postTargets: string[];
  allowEmptyRelease?: boolean;
  skipCommitTypes?: string[];
  commitMessageFormat?: string;
  preset: Preset;
  commitParserOptions?: CommitParserOptions;
}

export interface WriteChangelogConfig {
  changelogHeader: string;
  projectRoot: string;
  preset: Preset;
  dryRun?: boolean;
  changelogPath: string;
  tagPrefix: string;
}
