import { JsonObject } from '@angular-devkit/core';

export interface VersionBuilderSchema extends JsonObject {
  dryRun?: boolean;
  noVerify?: boolean;
  push?: boolean;
  remote?: string;
  baseBranch?: string;
  syncVersions?: boolean;
  rootChangelog?: boolean;
}
