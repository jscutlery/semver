import type { ExecutorContext } from '@nrwl/devkit';
import {
  parseTargetString,
  readTargetOptions,
  runExecutor,
  Target
} from '@nrwl/devkit';
import type { Observable } from 'rxjs';
import { concat, defer } from 'rxjs';
import { coerce, createTemplateString } from './template-string';

export function runPostTargets({
  postTargets,
  templateStringContext,
  context,
}: {
  postTargets: string[];
  templateStringContext: Record<string, unknown>;
  context: ExecutorContext;
}): Observable<void> {
  return concat(
    ...postTargets.map((postTargetSchema) => {
      return defer(async () => {
        const target = parseTargetString(postTargetSchema);
        _checkTargetExist(target, context);

        const resolvedOptions = _resolveTargetOptions({
          targetOptions: readTargetOptions(target, context),
          context: templateStringContext,
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

/* istanbul ignore next */
export function _resolveTargetOptions({
  targetOptions = {},
  context,
}: {
  targetOptions?: Record<string, unknown>;
  context: Record<string, unknown>;
}): Record<string, unknown> {
  return Object.entries(targetOptions).reduce(
    (optionsAccumulator, [option, value]) => {
      const resolvedValue =
        typeof value === 'object'
          ? value
          : coerce(
              createTemplateString(
                (value as number | string | boolean).toString(),
                context
              )
            );

      return {
        ...optionsAccumulator,
        [option]: resolvedValue,
      };
    },
    {}
  );
}

/* istanbul ignore next */
export function _checkTargetExist(target: Target, context: ExecutorContext) {
  const project = context.workspace.projects[target.project];

  if (project === undefined) {
    throw new Error(
      `The target project "${
        target.project
      }" does not exist in your workspace. Available projects: ${Object.keys(
        context.workspace.projects
      ).map((project) => `"${project}"`)}`
    );
  }

  const projectTarget = project.targets?.[target.target];

  if (projectTarget === undefined) {
    throw new Error(
      `The target name "${
        target.target
      }" does not exist. Available targets for "${
        target.project
      }": ${Object.keys(project.targets || {}).map((target) => `"${target}"`)}`
    );
  }
}
