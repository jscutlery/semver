import { Plugin, PluginOptions } from './plugin';

export const SUPPORTED_SEMANTIC_RELEASE_PLUGINS = ['@semantic-release/npm'];

export interface SemanticReleasePlugin extends Plugin {
  addChannel?(options: PluginOptions): Promise<unknown>;
}

export class SemanticReleasePluginAdapter implements Plugin {
  constructor(private _plugin: SemanticReleasePlugin) {}

  publish(options: PluginOptions) {
    this._plugin.addChannel(options);
    return this._plugin.publish(options);
  }
}

export function _adapt(pluginName: string, plugin: Plugin): Plugin {
  return SUPPORTED_SEMANTIC_RELEASE_PLUGINS.includes(pluginName)
    ? new SemanticReleasePluginAdapter(plugin)
    : plugin;
}
