import { JsonObject } from '@angular-devkit/core';

import { PluginDef } from './plugin';

export interface VersionBuilderSchema extends JsonObject {
  dryRun?: boolean;
  noVerify?: boolean;
  push?: boolean;
  remote?: string;
  baseBranch?: string;
  syncVersions?: boolean;
  rootChangelog?: boolean;
  plugins?: PluginDef[];
}
