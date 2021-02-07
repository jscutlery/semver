import { BuilderContext } from '@angular-devkit/architect';
import { resolve } from 'path';
import { concat, from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Plugin, PluginOptions } from './plugin';
import { readJsonFile } from './utils/filesystem';
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
  nextRelease: { version: string; channel?: string };
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
    _: PluginOptions,
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
  // @todo: refactor the following lines
  const pkgRoot = resolve(
    context.workspaceRoot,
    ((await context.getTargetOptions({
      project: context.target.project,
      target: 'build',
    })) as { outputPath: string }).outputPath
  );
  const projectMetadata = await context.getProjectMetadata(
    context.target.project
  );
  const projectRoot = projectMetadata.root as string;
  const packageJson = await readJsonFile(
    resolve(projectRoot, 'package.json')
  ).toPromise();

  return [
    resolve(context.workspaceRoot, '.npmrc'),
    {
      npmPublish: options.dryRun === false,
      pkgRoot,
    },
    packageJson,
    {
      cwd: projectRoot,
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr,
      nextRelease: { version: options.newVersion }, // @todo check what's "channel" prop, default "latest"
      logger: { log: context.logger.info },
    },
  ];
}

export function adapt(pluginName: string, plugin: Plugin): Plugin {
  return SUPPORTED_SEMANTIC_RELEASE_PLUGINS.includes(pluginName)
    ? new SemanticReleasePluginAdapter(plugin as SemanticReleasePlugin)
    : plugin;
}
