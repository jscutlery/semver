import { BuilderContext } from '@angular-devkit/architect';
import { defer, from, isObservable, Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import { Plugin, PluginDef, PluginOptions } from './plugin';
import { adapt } from './plugin-adapter';
import { CommonVersionOptions } from './version';

export type PluginMap = [Plugin, PluginOptions][];

export class PluginHandler {
  private _plugins: PluginMap;
  private _options: CommonVersionOptions;
  private _context: BuilderContext;

  constructor({
    plugins,
    options,
    context,
  }: {
    plugins: PluginDef[];
    options: CommonVersionOptions;
    context: BuilderContext;
  }) {
    this._options = options;
    this._context = context;
    this._plugins = _loadPlugins(plugins);
  }

  publish(): Observable<unknown> {
    return this._run('publish');
  }

  private _run(hook: keyof Plugin): Observable<unknown> {
    return defer(() =>
      from(this._plugins).pipe(
        concatMap(([plugin, options]) => {
          const result = plugin[hook](options, this._options, this._context);
          return isObservable(result) ? result : from(result);
        })
      )
    );
  }
}

export function createPluginHandler({
  plugins,
  options,
  context,
}: {
  plugins: PluginDef[];
  options: CommonVersionOptions;
  context: BuilderContext;
}) {
  return new PluginHandler({ plugins, options, context });
}

export function _loadPlugins(pluginDefinition: PluginDef[]): PluginMap {
  return pluginDefinition.map<[Plugin, PluginOptions]>((pluginDef) => [
    _load(pluginDef),
    _getPluginOptions(pluginDef),
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
  return adapt(pluginName, require(pluginName));
}
