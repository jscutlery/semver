import { BuilderContext } from '@angular-devkit/architect';
import { resolve } from 'path';

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

  async publish(
    _pluginOptions: PluginOptions,
    options: CommonVersionOptions,
    context: BuilderContext
  ) {
    await this._plugin.addChannel(...(await _createOptions(options, context)));
    return this._plugin.publish(...(await _createOptions(options, context)));
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
      configuration: 'production', // @todo check if it's required
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
    ? new SemanticReleasePluginAdapter(plugin)
    : plugin;
}
