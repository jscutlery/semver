export interface SchemaOptions {
  syncVersions: boolean;
  push: boolean;
  remote: string;
  branch: string;
  projects?: string[];
  enforceConventionalCommits?: boolean;
  skipInstall?: boolean;
}
