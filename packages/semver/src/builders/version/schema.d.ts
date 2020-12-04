import { JsonObject } from '@angular-devkit/core';

export interface VersionBuilderSchema extends JsonObject {
  root: string;
  dryRun?: boolean;
  noVerify?: boolean;
  firstRelease?: boolean;
}
