import { BuilderContext } from '@angular-devkit/architect';
import { resolve } from 'path';
import { EMPTY, forkJoin, from, Observable, of, throwError } from 'rxjs';
import { concatMap, map, mergeMap } from 'rxjs/operators';

import { PluginDef, PluginOptions, SemverOptions, SemverPlugin } from './plugin';
import { PluginFactory, UnknownPlugin } from './plugin-factory';
import { getOutputPath, getProjectRoot } from './utils/workspace';
import { CommonVersionOptions } from './version';

export type PluginMap = [SemverPlugin, PluginOptions][];

export type Hook = Extract<
  keyof SemverPlugin,
  'validate' | 'prepare' | 'publish'
>;

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
    this._plugins = _loadPlugins(plugins, context);
  }

  validate(): Observable<boolean> {
    return this._handle('validate').pipe(
      mergeMap((valid) =>
        typeof valid !== 'boolean'
          ? throwError(
              new Error(
                `Typeof result from 'validate' hook not expected, received: ${typeof valid}, expect boolean`
              )
            )
          : of(valid)
      )
    );
  }

  prepare(): Observable<unknown> {
    return this._handle('prepare');
  }

  publish(): Observable<unknown> {
    return this._handle('publish');
  }

  private _handle(hook: Hook): Observable<unknown> {
    return this._getSemverOptions().pipe(
      mergeMap((semverOptions) =>
        from(this._plugins).pipe(
          concatMap(([plugin, pluginOptions]) => {
            if (typeof plugin[hook] !== 'function') {
              return EMPTY;
            }
            const hookFn = plugin[hook].bind(plugin,
              semverOptions,
              pluginOptions,
            );
            return from(hookFn());
          })
        )
      )
    );
  }

  private _getSemverOptions(): Observable<SemverOptions> {
    const context = this._context;
    const { newVersion, dryRun } = this._options;
    const projectRoot$ = getProjectRoot(context);
    const outputPath$ = getOutputPath(context);

    return forkJoin([projectRoot$, outputPath$]).pipe(
      map(([projectRoot, packageRoot]) => ({
        packageRoot,
        projectRoot,
        dryRun,
        newVersion,
      }))
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

export function _loadPlugins(pluginDefinition: PluginDef[], context: BuilderContext): PluginMap {
  return pluginDefinition.map<[SemverPlugin, PluginOptions]>((pluginDef) => [
    _load(pluginDef, context),
    _getPluginOptions(pluginDef),
  ]);
}

export function _getModule(pluginDef: PluginDef): string {
  return typeof pluginDef === 'string' ? pluginDef : pluginDef.module;
}

export function _getPluginOptions(pluginDef: PluginDef): PluginOptions {
  return typeof pluginDef === 'string' ? {} : pluginDef.options ?? {};
}

export function _load(pluginDef: PluginDef, { workspaceRoot }: { workspaceRoot: string }): SemverPlugin {
  const name = _getModule(pluginDef);

  let plugin: UnknownPlugin;
  try {
    plugin = require(name);
  } catch (error) {
    plugin = require(resolve(workspaceRoot, 'node_modules', name))
  }

  if (plugin == null) {
    throw new Error(`Could not resolve plugin: ${name}`);
  }

  return PluginFactory.create({ name, plugin });
}
