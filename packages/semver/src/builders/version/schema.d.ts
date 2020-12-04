import { JsonObject } from '@angular-devkit/core';

export interface VersionBuilderSchema extends JsonObject {
  dryRun?: boolean;
  noVerify?: boolean;
  firstRelease?: boolean;
}
