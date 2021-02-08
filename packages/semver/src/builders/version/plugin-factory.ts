import { BuilderContext } from '@angular-devkit/architect';
import { concat, from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { PluginOptions, PluginType, SemverPlugin } from './plugin';
import { getOutputPath, getProjectRoot } from './utils/workspace';
import { CommonVersionOptions } from './version';

export interface RawSemanticReleasePlugin {
  addChannel?(...args: SemanticReleasePluginOptions): Promise<unknown>;
  publish?(...args: SemanticReleasePluginOptions): Promise<unknown>;
}

export interface SemanticReleaseContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;
  nextRelease: { version: string; channel?: string };
  logger: { log(msg: string): void };
}

export type SemanticReleasePluginOptions = [
  pluginOptions: { npmPublish: boolean; pkgRoot: string },
  context: SemanticReleaseContext
];

export class SemanticReleasePlugin implements SemverPlugin {
  name: string;

  type: PluginType = '@semantic-release';

  private _plugin: RawSemanticReleasePlugin;

  constructor({
    name,
    plugin,
  }: {
    name: string;
    plugin: RawSemanticReleasePlugin;
  }) {
    this.name = name;
    this._plugin = plugin;
  }

  publish(
    _: PluginOptions,
    options: CommonVersionOptions,
    context: BuilderContext
  ): Observable<unknown> {
    return from(_createOptions(options, context)).pipe(
      switchMap((options) =>
        concat(
          this._plugin.publish(...options),
          this._plugin.addChannel(...options),
        )
      )
    );
  }
}

export async function _createOptions(
  options: CommonVersionOptions,
  context: BuilderContext
): Promise<SemanticReleasePluginOptions> {
  const pkgRoot = await getOutputPath(context).toPromise();
  const projectRoot = await getProjectRoot(context).toPromise();

  return [
    {
      npmPublish: options.dryRun === false,
      pkgRoot,
    },
    {
      cwd: projectRoot,
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr,
      nextRelease: { version: options.newVersion }, // @todo handle channel option
      logger: { log: context.logger.info },
    },
  ];
}

export class PluginFactory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static create({ name, plugin }: { name: string; plugin: any }): SemverPlugin {
    switch (true) {
      case _isSemanticPlugin(plugin):
        return new SemanticReleasePlugin({ name, plugin });

      case _isSemverPlugin(plugin):
        return plugin;

      default:
        throw new Error(`Plugin not supported`);
    }
  }
}

export function _isSemanticPlugin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugin: any
): plugin is RawSemanticReleasePlugin {
  const hasHookFn = (typeof plugin.verifyConditions === 'function' ||
      typeof plugin.verifyRelease === 'function' ||
      typeof plugin.generateNotes === 'function' ||
      typeof plugin.publish === 'function' ||
      typeof plugin.addChannel === 'function');

  return _isSemverPlugin(plugin) === false && hasHookFn;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function _isSemverPlugin(plugin: any): plugin is SemverPlugin {
  return plugin.type === '@jscutlery/semver-plugin';
}
