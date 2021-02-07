import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';

export interface SemverPlugin {
  name: string;
  type: PluginType;
  publish?(...args: unknown[]): Promise<unknown> | Observable<unknown>;
}

export type PluginType = '@jscutlery/semver-plugin' | '@semantic-release';

/**
 * Match workspace definition : ['@custom-plugin', { 'plugin-option': 'option' }] or '@custom-plugin'
 */
export type PluginDef = [string, JsonObject] | string;

export type PluginOptions = Record<string, unknown>;
