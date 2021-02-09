import { concat, defer, Observable, of } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';

import { PluginType, SemverOptions, SemverPlugin } from './plugin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnknownPlugin = any;

export interface NativeSemanticReleasePlugin {
  addChannel?(...args: SemanticReleasePluginOptions): Promise<unknown>;
  publish?(...args: SemanticReleasePluginOptions): Promise<unknown>;
  verifyConditions?(...args: SemanticReleasePluginOptions): Promise<boolean>;
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

export class SemanticReleasePluginAdapter implements SemverPlugin {
  name: string;

  type: PluginType = '@semantic-release';

  private _nativePlugin: NativeSemanticReleasePlugin;

  constructor({
    name,
    plugin,
  }: {
    name: string;
    plugin: NativeSemanticReleasePlugin;
  }) {
    this.name = name;
    this._nativePlugin = plugin;
  }

  publish(semverOptions: SemverOptions): Observable<unknown> {
    return defer(() => {
      concat(
        this._nativePlugin.publish(..._createOptions(semverOptions)),
        this._nativePlugin.addChannel(..._createOptions(semverOptions))
      );
    });
  }

  validate(semverOptions: SemverOptions): Observable<boolean> {
    return defer(() =>
      this._nativePlugin.verifyConditions(..._createOptions(semverOptions))
    ).pipe(
      mapTo(true),
      catchError(() => of(false))
    );
  }
}

export function _createOptions(
  semverOptions: SemverOptions
): SemanticReleasePluginOptions {
  return [
    {
      npmPublish: semverOptions.dryRun === false,
      pkgRoot: semverOptions.packageRoot,
    },
    {
      cwd: semverOptions.projectRoot,
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr,
      nextRelease: { version: semverOptions.newVersion }, // @todo handle channel option
      logger: { log: console.info },
    },
  ];
}

export class PluginFactory {
  static create({
    name,
    plugin,
  }: {
    name: string;
    plugin: UnknownPlugin;
  }): SemverPlugin {
    switch (true) {
      case _isSemanticReleasePlugin(plugin):
        return new SemanticReleasePluginAdapter({ name, plugin });

      case _isSemverPlugin(plugin):
        return plugin;

      default:
        throw new Error(`Plugin not supported: ${name}`);
    }
  }
}

export function _isSemanticReleasePlugin(
  plugin: UnknownPlugin
): plugin is NativeSemanticReleasePlugin {
  const hasHookFn = [
    'verifyConditions',
    'verifyRelease',
    'generateNotes',
    'publish',
    'addChannel',
  ].some((hook) => typeof plugin[hook] === 'function');

  return _isSemverPlugin(plugin) === false && hasHookFn;
}

export function _isSemverPlugin(plugin: UnknownPlugin): plugin is SemverPlugin {
  return plugin.type === '@jscutlery/semver-plugin';
}
