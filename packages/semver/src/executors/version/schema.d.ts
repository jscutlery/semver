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
  | 'conventionalcommits'
  | 'atom'
  | 'codemirror'
  | 'ember'
  | 'eslint'
  | 'express'
  | 'jquery'
  | 'jshint'
  | Record<string, any>; // Custom preset, see: https://github.com/conventional-changelog/conventional-changelog-config-spec/blob/master/versions/2.2.0/README.md

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
  preset: Preset | 'conventional'; // @TODO: Remove 'conventional' in the next major release.
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
