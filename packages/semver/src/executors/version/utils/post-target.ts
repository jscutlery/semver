import { parseTargetString, runExecutor } from '@nrwl/devkit';
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

export function normalizePostTarget({
  postTargetSchema,
  options,
  context,
}: {
  postTargetSchema: PostTargetSchema;
  options: ResolvablePostTargetOptions;
  context: ExecutorContext;
}): Parameters<typeof runExecutor> {
  const hasConfig = typeof postTargetSchema === 'object';
  const target = parseTargetString(
    hasConfig ? postTargetSchema.executor : postTargetSchema
  );
  const rawPostTargetOptions: Record<string, unknown> = hasConfig
    ? postTargetSchema.options ?? {}
    : {};
  const resolvedTargetOptions = Object.entries(rawPostTargetOptions).reduce(
    (resolvedOptions, [option, value]) => ({
      ...resolvedOptions,
      [option]: resolveInterpolation(value.toString(), options),
    }),
    {}
  );

  return [target, resolvedTargetOptions, context];
}

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
      const executorOptions = normalizePostTarget({
        postTargetSchema,
        options,
        context,
      });

      return defer(async () => {
        const run = await runExecutor(...executorOptions);
        for await (const { success } of run) {
          if (!success) {
            throw new Error(
              `Something went wrong with post target: "${options[0].project}:${options[0].target}"`
            );
          }
        }
      });
    })
  );
}
