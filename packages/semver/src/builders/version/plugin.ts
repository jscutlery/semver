import { JsonObject } from '@angular-devkit/core';

export interface Plugin {
  publish?(options: unknown): Promise<void>;
}

/**
 * Match workspace definition : ['@custom-plugin', { 'plugin-option': 'option' }] or '@custom-plugin'
 */
export type PluginDef = [string, JsonObject] | string;

/**
 * Loaded plugins map,
 * unknown represent the plugin options.
 */
export type PluginMap = [Plugin, unknown][];
