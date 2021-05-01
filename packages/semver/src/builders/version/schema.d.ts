export type VersioningType = 'independent' | 'sync-group';

export interface SemverConfig {
  /**
   * Name of the project or sync-group, for independent versioning this should match the project name.
   * @example "rx-state"
   * @example "cdk"
   */
  name: string;

  /**
   * Versioning type.
   * @values "independent" | "sync-group"
   */
  type: VersioningType;

  /**
   * Path of the project or sync-group where to execute semver.
   * @example "packages/rx-state"
   * @example "packages/cdk"
   * @todo make this optional for independent mode, pick it from workspace def.
   */
  path: string;

  /**
   * Define projects path within a sync-group.
   * @example ["packages/cdk/helpers", "packages/cdk/operators"]
   * @todo wildcard support, eg: ["packages/cdk/*"].
   */
  packages?: string[];
}

export interface SemverOptions {
  dryRun: boolean;
  noVerify: boolean;
  push: boolean;
  remote: string;
  baseBranch: string;
  skipRootChangelog: boolean;
  skipProjectChangelog: boolean;
  version?: 'patch' | 'minor' | 'major' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease';
  preid?: string;
  changelogHeader?: string;
  configs: SemverConfig[];
}

export type VersionBuilderSchema = Partial<SemverOptions>;
