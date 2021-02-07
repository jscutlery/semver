import { BuilderContext } from '@angular-devkit/architect';
import { resolve } from 'path';
import { concat, from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { PluginOptions, PluginType, SemverPlugin } from './plugin';
import { readJsonFile } from './utils/filesystem';
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
  npmrc: string,
  config: { npmPublish: boolean; pkgRoot: string },
  pkg: { name: string },
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

export class SemanticReleasePluginAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static adapt({ name, plugin }: { name: string; plugin: any }): SemverPlugin {
    switch (true) {
      case _isSemanticPlugin(plugin):
      return new SemanticReleasePlugin({ name, plugin });

      case _isSemverPlugin(plugin):
      return plugin;

      default:
        throw new Error(`Plugin not supported: ${plugin}`);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function _isSemanticPlugin(plugin: any): plugin is RawSemanticReleasePlugin {
  return typeof plugin.publish === 'function' && typeof plugin.verifyCondition === 'function';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function _isSemverPlugin(plugin: any): plugin is SemverPlugin {
  return plugin.type === '@jscutlery/semver-plugin';
}
