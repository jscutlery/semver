import { JsonObject } from '@angular-devkit/core';

export interface Plugin {
  publish?(...args: unknown[]): Promise<unknown>;
}

/**
 * Match workspace definition : ['@custom-plugin', { 'plugin-option': 'option' }] or '@custom-plugin'
 */
export type PluginDef = [string, JsonObject] | string;

export type PluginOptions = Record<string, unknown>;

export type PluginMap = [Plugin, PluginOptions][];
