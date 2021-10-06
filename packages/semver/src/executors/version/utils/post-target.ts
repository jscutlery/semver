import { parseTargetString, runExecutor, Target } from '@nrwl/devkit';
import { concat, defer } from 'rxjs';

import { resolveInterpolation } from './resolve-interpolation';

import type { Observable } from 'rxjs';
import type { ExecutorContext } from '@nrwl/devkit';
import type { PostTargetSchema, VersionBuilderSchema } from '../schema';
import type { CommonVersionOptions } from '../version';

export type ResolvablePostTargetOptions = Partial<
  Pick<CommonVersionOptions, 'tagPrefix' | 'dryRun' | 'noVerify'> &
    Pick<VersionBuilderSchema, 'baseBranch' | 'remote'> & {
      version: string;
    }
>;

export function executePostTargets({
  postTargets,
  options,
  context,
}: {
  postTargets: PostTargetSchema[];
  options: ResolvablePostTargetOptions;
  context: ExecutorContext;
}): Observable<void> {
  return concat(
    ...postTargets.map((postTargetSchema) => {
      const [target, targetOptions] = _normalizePostTarget({
        postTargetSchema,
      });
      const resolvedOptions = _resolveTargetOptions({
        targetOptions,
        resolvableContext: options,
      });

      return defer(async () => {
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
  resolvableContext,
}: {
  targetOptions: Record<string, unknown>;
  resolvableContext: ResolvablePostTargetOptions;
}): Record<string, unknown> {
  return Object.entries(targetOptions).reduce(
    (resolvedOptions, [option, value]) => ({
      ...resolvedOptions,
      [option]: resolveInterpolation(value.toString(), resolvableContext),
    }),
    {}
  );
}
