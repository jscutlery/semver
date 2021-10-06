import {
  parseTargetString,
  readTargetOptions,
  runExecutor,
} from '@nrwl/devkit';
import { concat, defer } from 'rxjs';

import { resolveInterpolation } from './resolve-interpolation';

import type { Observable } from 'rxjs';
import type { ExecutorContext } from '@nrwl/devkit';

export function executePostTargets({
  postTargets,
  resolvableOptions = {},
  context,
}: {
  postTargets: string[];
  resolvableOptions?: Record<string, unknown>;
  context: ExecutorContext;
}): Observable<void> {
  return concat(
    ...postTargets.map((postTargetSchema) => {
      return defer(async () => {
        const target = parseTargetString(postTargetSchema);
        const resolvedOptions = _resolveTargetOptions({
          targetOptions: readTargetOptions(target, context),
          resolvableOptions,
        });

        for await (const { success } of await runExecutor(
          target,
          resolvedOptions,
          context
        )) {
          if (!success) {
            throw new Error(
              `Something went wrong with post target: "${target.project}:${target.target}"`
            );
          }
        }
      });
    })
  );
}

export function _resolveTargetOptions({
  targetOptions = {},
  resolvableOptions,
}: {
  targetOptions?: Record<string, unknown>;
  resolvableOptions: Record<string, unknown>;
}): Record<string, unknown> {
  return Object.entries(targetOptions).reduce(
    (resolvedOptions, [option, value]) => {
      const resolvedOption =
        typeof value === 'object'
          ? value
          : resolveInterpolation(value.toString(), resolvableOptions);

      return {
        ...resolvedOptions,
        [option]: resolvedOption,
      };
    },
    {}
  );
}
