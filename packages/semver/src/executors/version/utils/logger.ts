import { logger } from '@nrwl/devkit';
import * as chalk from 'chalk';
import { tap, type MonoTypeOperatorFunction } from 'rxjs';

type Step =
  | 'nothing_changed'
  | 'failure'
  | 'warning'
  | 'calculate_version_success'
  | 'package_json_success'
  | 'custom_json_success'
  | 'changelog_success'
  | 'tag_success'
  | 'post_target_success'
  | 'push_success'
  | 'commit_success';

const iconMap = new Map<Step, string>([
  ['failure', '❌'],
  ['warning', '🟠'],
  ['nothing_changed', '🟢'],
  ['calculate_version_success', '🆕'],
  ['changelog_success', '📜'],
  ['commit_success', '📦'],
  ['package_json_success', '📝'],
  ['custom_json_success', '📝'],
  ['post_target_success', '🎉'],
  ['tag_success', '🔖'],
  ['push_success', '🚀'],
]);

/* istanbul ignore next */
export function logStep<T>({
  step,
  message,
  projectName,
}: {
  step: Step;
  message: string;
  projectName: string;
}): MonoTypeOperatorFunction<T> {
  return (source) =>
    source.pipe(tap(() => _logStep({ step, message, projectName })));
}

/* istanbul ignore next */
export function _logStep({
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
    step
  )} ${message}`;
  logger[level](msg);
}
