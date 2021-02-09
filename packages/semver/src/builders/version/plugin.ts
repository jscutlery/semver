import { Observable } from 'rxjs';

export interface SemverPlugin {
  name: string;
  type: PluginType;

  validate?(
    semverOptions: SemverOptions,
    pluginOptions?: PluginOptions
  ): Promise<boolean> | Observable<boolean>;

  prepare?(
    semverOptions: SemverOptions,
    pluginOptions?: PluginOptions
  ): Promise<unknown> | Observable<unknown>;

  publish?(
    semverOptions: SemverOptions,
    pluginOptions?: PluginOptions
  ): Promise<unknown> | Observable<unknown>;
}

export interface SemverOptions {
  packageRoot: string;
  projectRoot: string;
  newVersion: string;
  dryRun: boolean;
}

export type PluginType = '@jscutlery/semver-plugin' | '@semantic-release';

export type PluginDef = string | { module: string; options?: PluginOptions };

export type PluginOptions = Record<string, string | number | boolean>;
