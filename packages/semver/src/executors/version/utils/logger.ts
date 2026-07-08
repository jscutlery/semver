import { logger } from '@nx/devkit';
import * as chalk from 'chalk';

type Step =
  | 'nothing_changed'
  | 'failure'
  | 'warning'
  | 'calculate_version_success'
  | 'package_json_success'
  | 'changelog_success'
  | 'tag_success'
  | 'post_target_success'
  | 'push_success'
  | 'commit_success'
  | 'npm_auth_success';

const iconMap = new Map<Step, string>([
  ['failure', '❌'],
  ['warning', '🟠'],
  ['nothing_changed', '🟢'],
  ['calculate_version_success', '🆕'],
  ['changelog_success', '📜'],
  ['commit_success', '📦'],
  ['package_json_success', '📝'],
  ['post_target_success', '🎉'],
  ['tag_success', '🔖'],
  ['push_success', '🚀'],
  ['npm_auth_success', '🔐'],
]);

/* istanbul ignore next */
export function logStep({
  step,
  message,
  projectName,
  level = 'log',
}: {
  step: Step;
  message: string;
  projectName: string;
  level?: keyof typeof logger;
}): void {
  const msg = `${chalk.bold(`[${projectName}]`)} ${iconMap.get(
    step,
  )} ${message}`;
  logger[level](msg);
}
