import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';

export interface Plugin {
  publish?(...args: unknown[]): Promise<unknown> | Observable<unknown>;
}

/**
 * Match workspace definition : ['@custom-plugin', { 'plugin-option': 'option' }] or '@custom-plugin'
 */
export type PluginDef = [string, JsonObject] | string;

export type PluginOptions = Record<string, unknown>;
