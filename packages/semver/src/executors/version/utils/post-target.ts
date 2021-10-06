import { parseTargetString, runExecutor, Target } from '@nrwl/devkit';
import { concat, defer } from 'rxjs';

import { resolveInterpolation } from './resolve-interpolation';

import type { Observable } from 'rxjs';
import type { ExecutorContext } from '@nrwl/devkit';
import type { PostTargetSchema } from '../schema';

export function executePostTargets({
  postTargets,
  resolvableOptions = {},
  context,
}: {
  postTargets: PostTargetSchema[];
  resolvableOptions?: Record<string, unknown>;
  context: ExecutorContext;
}): Observable<void> {
  return concat(
    ...postTargets.map((postTargetSchema) => {
      return defer(async () => {

        const [target, targetOptions] = _normalizePostTarget({
          postTargetSchema,
        });
        const resolvedOptions = _resolveTargetOptions({
          targetOptions,
          resolvableOptions,
        });

        const run = await runExecutor(target, resolvedOptions, context);
        for await (const { success } of run) {
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

export function _normalizePostTarget({
  postTargetSchema,
}: {
  postTargetSchema: PostTargetSchema;
}): [Target, Record<string, unknown>] {
  const hasConfig = typeof postTargetSchema === 'object';
  const target = parseTargetString(
    hasConfig ? postTargetSchema.executor : postTargetSchema
  );
  const targetOptions = hasConfig ? postTargetSchema.options ?? {} : {};

  return [target, targetOptions];
}

export function _resolveTargetOptions({
  targetOptions,
  resolvableOptions,
}: {
  targetOptions: Record<string, unknown>;
  resolvableOptions: Record<string, unknown>;
}): Record<string, unknown> {
  return Object.entries(targetOptions).reduce(
    (resolvedOptions, [option, value]) => {
      let resolvedOption;

      if (typeof value === 'object') {
        resolvedOption = value;
      } else if (typeof value === 'string') {
        resolvedOption = resolveInterpolation(value, resolvableOptions);
      } else {
        throw new TypeError(
          `Cannot resolve "${option}" with type ${typeof value}`
        );
      }

      return {
        ...resolvedOptions,
        [option]: resolvedOption,
      };
    },
    {}
  );
}
