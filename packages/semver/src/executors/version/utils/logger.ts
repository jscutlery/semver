import { logger } from '@nrwl/devkit';
import { tap, type MonoTypeOperatorFunction } from 'rxjs';

type Step =
  | 'package_json_success'
  | 'changelog_success'
  | 'tag_success'
  | 'post_target_success'
  | 'push_success'
  | 'commit_success';

const prefixMap = new Map<Step, string>([
  ['changelog_success', '📜'],
  ['commit_success', '📦'],
  ['package_json_success', '📝'],
  ['post_target_success', '🎉'],
  ['tag_success', '🔖'],
  ['push_success', '🚀'],
]);

/* istanbul ignore next */
export function logStep<T>({
  step,
  message,
}: {
  step: Step;
  message: string;
}): MonoTypeOperatorFunction<T> {
  return (source) => source.pipe(tap(() => _log({ step, message })));
}

/* istanbul ignore next */
function _log({
  step,
  message,
}: {
  step: Step;
  message: string;
}): void {
  const msg = `${prefixMap.get(step)} ${message}`;
  logger.log(msg);
}
