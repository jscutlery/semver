import { SemverPlugin } from './plugin';
import { RawSemanticReleasePlugin, SemanticReleasePlugin } from './semantic-release-plugin';

export class PluginAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static adapt({ name, plugin }: { name: string; plugin: any }): SemverPlugin {
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
  return (
    typeof plugin.publish === 'function' &&
    typeof plugin.verifyCondition === 'function'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function _isSemverPlugin(plugin: any): plugin is SemverPlugin {
  return plugin.type === '@jscutlery/semver-plugin';
}
