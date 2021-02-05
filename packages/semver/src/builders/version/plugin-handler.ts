import { defer, Observable } from 'rxjs';

import { Plugin, PluginDef, PluginMap, PluginOptions } from './plugin';
import { _adapt } from './plugin-adapter';

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

export function createPluginHandler({ plugins }: { plugins: PluginDef[] }) {
  return new PluginHandler({ plugins });
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

export function _load(pluginDef: PluginDef): Plugin {
  const pluginName = _getPluginName(pluginDef);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return _adapt(pluginName, require(pluginName));
}
