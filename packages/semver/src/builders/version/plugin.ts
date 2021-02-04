import { JsonObject } from '@angular-devkit/core';
import { defer, Observable } from 'rxjs';

export class PluginHandler {
  private plugins: PluginMap;

  constructor({ plugins }: { plugins: PluginDef[] }) {
    this.plugins = this._load(plugins);
  }

  publish(): Observable<void> {
    return defer(() => this._run('publish'));
  }

  private async _run(hook: keyof Plugin): Promise<void> {
    const plugins = this.plugins;
    for (const [plugin, options] of plugins) {
      const hookFn = plugin[hook];
      // @todo pass context and right options
      hookFn && (await hookFn(options));
    }
  }

  private _load(plugins: PluginDef[]): PluginMap {
    return plugins.map<[Plugin, unknown]>((plugin) =>
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
