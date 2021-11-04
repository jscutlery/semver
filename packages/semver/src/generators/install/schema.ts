export interface SchemaOptions {
  syncVersions: boolean;
  baseBranch?: string;
  projects?: string[];
  enforceConventionalCommits?: boolean;
  skipInstall?: boolean;
}
