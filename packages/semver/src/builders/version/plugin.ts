import { JsonObject } from '@angular-devkit/core';
import { defer } from 'rxjs';

export class PluginHandler {
  private plugins: PluginMap;

  constructor({ plugins }: { plugins: PluginDef[] }) {
    this.plugins = this._load(plugins);
  }

  publish() {
    return defer(async () => this._run('publish'));
  }

  private async _run(hook: keyof Plugin): Promise<void> {
    const plugins = this.plugins;
    for (const [plugin, options] of plugins) {
      const hookFn = plugin[hook];
      hookFn && (await hookFn(options));
    }
  }

  private _load(plugins: PluginDef[]): PluginMap {
    return plugins.map<PluginMap[0]>((plugin) =>
      typeof plugin === 'string'
        ? [require(plugin), undefined]
        : [require(plugin[0]), plugin[1]]
    );
  }
}

export interface Plugin {
  publish?(options: unknown): Promise<void>;
}

/**
 * Match workspace definition : ['@custom-plugin', { 'plugin-option': 'option' }] or '@custom-plugin'
 */
export type PluginDef = [string, JsonObject] | string;

/**
 * Loaded plugin map,
 * The second entry represent the plugin options.
 */
export type PluginMap = [Plugin, unknown][];
