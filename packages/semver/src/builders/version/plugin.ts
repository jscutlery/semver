import { JsonObject } from '@angular-devkit/core';
import { Observable, defer } from 'rxjs';

export const SUPPORTED_SEMANTIC_RELEASE_PLUGINS = [
  '@semantic-release/npm'
];

export class PluginHandler {
  private _plugins: PluginMap;

  constructor({ plugins }: { plugins: PluginDef[] }) {
    this._plugins = _loadPlugins(plugins);
  }

  publish(): Observable<unknown> {
    return this._run('publish');
  }

  private _run(hook: keyof Plugin): Observable<unknown> {
    return defer(() => {
      const plugins = this._plugins;
      return Promise.all(
        plugins
          .filter(([plugin]) => typeof plugin[hook] === 'function')
          .map(([plugin, options]) => plugin[hook](options))
      );
    });
  }
}

export function _loadPlugins(pluginDefinition: PluginDef[]): PluginMap {
  return pluginDefinition.map<[Plugin, PluginOptions]>((pluginDef) => [
    _load(pluginDef),
    _getPluginOptions(pluginDef), // @todo pass right context
  ]);
}

export function _getPluginName(pluginDef: PluginDef): string {
  return typeof pluginDef === 'string' ? pluginDef : pluginDef[0];
}

export function _getPluginOptions(pluginDef: PluginDef): PluginOptions {
  return typeof pluginDef === 'string' ? {} : pluginDef[1];
}

export function _load(pluginDef: PluginDef) {
  const pluginName = _getPluginName(pluginDef);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return _adapt(pluginName, require(pluginName));
}

export function _adapt(pluginName: string, plugin: Plugin) {
  return SUPPORTED_SEMANTIC_RELEASE_PLUGINS.includes(pluginName)
    ? new SemanticReleasePluginAdapter(plugin)
    : plugin;
}

export class SemanticReleasePluginAdapter implements Plugin {
  constructor(private _plugin: SemanticReleasePlugin) {}

  publish(options: PluginOptions) {
    this._plugin.addChannel(options);
    return this._plugin.publish(options);
  }
}

export interface Plugin {
  publish?(options: PluginOptions): Promise<unknown>;
}

export interface SemanticReleasePlugin extends Plugin {
  addChannel?(options: PluginOptions): Promise<unknown>;
}

/**
 * Match workspace definition : ['@custom-plugin', { 'plugin-option': 'option' }] or '@custom-plugin'
 */
export type PluginDef = [string, JsonObject] | string;

export type PluginOptions = Record<string, unknown>;

export type PluginMap = [Plugin, PluginOptions][];
