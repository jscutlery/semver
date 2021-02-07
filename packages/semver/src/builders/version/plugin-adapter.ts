import { BuilderContext } from '@angular-devkit/architect';
import { resolve } from 'path';
import { concat, from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Plugin, PluginOptions } from './plugin';
import { CommonVersionOptions } from './version';

export const SUPPORTED_SEMANTIC_RELEASE_PLUGINS = ['@semantic-release/npm'];

export interface SemanticReleasePlugin {
  addChannel?(...args: SemanticReleasePluginOptions): Promise<unknown>;
  publish?(...args: SemanticReleasePluginOptions): Promise<unknown>;
}

export interface SemanticReleaseContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;
  nextRelease: { version: string | undefined; channel: string | undefined };
  logger: { log(msg: string): void };
}

export type SemanticReleasePluginOptions = [
  npmrc: string,
  config: { npmPublish: boolean; pkgRoot: string },
  pkg: { name: string },
  context: SemanticReleaseContext
];

export class SemanticReleasePluginAdapter implements Plugin {
  constructor(private _plugin: SemanticReleasePlugin) {}

  publish(
    _pluginOptions: PluginOptions,
    options: CommonVersionOptions,
    context: BuilderContext
  ): Observable<unknown> {
    return from(_createOptions(options, context)).pipe(
      switchMap((options) =>
        concat(
          this._plugin.addChannel(...options),
          this._plugin.publish(...options)
        )
      )
    );
  }
}

export async function _createOptions(
  options: CommonVersionOptions,
  context: BuilderContext
): Promise<SemanticReleasePluginOptions> {
  const pkgRoot = resolve(
    context.workspaceRoot,
    ((await context.getTargetOptions({
      project: context.target.project,
      target: 'build',
    })) as { outputPath: string }).outputPath
  );

  return [
    resolve(context.workspaceRoot, '.npmrc'),
    {
      npmPublish: options.dryRun === false,
      pkgRoot,
    },
    { name: context.target.project }, // @todo use name from package.json
    {
      cwd: process.cwd(), // @todo check if it's correct
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr,
      nextRelease: { version: undefined, channel: undefined }, // @todo map these options
      logger: { log: context.logger.info },
    },
  ];
}

export function adapt(pluginName: string, plugin: Plugin): Plugin {
  return SUPPORTED_SEMANTIC_RELEASE_PLUGINS.includes(pluginName)
    ? new SemanticReleasePluginAdapter(plugin as SemanticReleasePlugin)
    : plugin;
}
