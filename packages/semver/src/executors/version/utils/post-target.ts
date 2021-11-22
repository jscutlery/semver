import {
  parseTargetString,
  readTargetOptions,
  runExecutor,
  Target,
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
        _checkTargetExist(target, context);

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

/* istanbul ignore next */
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
          : resolveInterpolation(
              (value as number | string).toString(),
              resolvableOptions
            );

      return {
        ...resolvedOptions,
        [option]: resolvedOption,
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
