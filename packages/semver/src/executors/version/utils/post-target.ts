import { parseTargetString, runExecutor } from '@nrwl/devkit';
import { defer } from 'rxjs';

import type { Observable } from 'rxjs';
import type { ExecutorContext } from '@nrwl/devkit';
import type { PostTargetSchema } from '../schema';

export function normalizePostTarget(
  postTargetSchema: PostTargetSchema,
  context: ExecutorContext
): Parameters<typeof runExecutor> {
  return typeof postTargetSchema === 'string'
    ? [parseTargetString(postTargetSchema), {}, context]
    : [
        parseTargetString(postTargetSchema.executor),
        postTargetSchema.options,
        context,
      ];
}

export function executePostTargets(
  postTargets: PostTargetSchema[],
  context: ExecutorContext
): Observable<void>[] {
  return postTargets.map((postTarget) => {
    const options = normalizePostTarget(postTarget, context);
    return defer(async () => {
      const run = await runExecutor(...options);
      for await (const result of run) {
        if (!result.success) {
          throw new Error(
            `Something went wrong with post target: "${options[0].project}:${options[0].target}"`
          );
        }
      }
    });
  });
}
