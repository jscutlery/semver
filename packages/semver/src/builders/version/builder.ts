import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { from, Observable, of } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';

import { VersionBuilderSchema } from './schema';
import { runSemver, SemverContext } from './version';

export function runBuilder(
  schema: VersionBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  const { workspaceRoot } = context;
  return from(
    runSemver({
      ...schema,
      workspaceRoot,
      logger: context.logger,
    } as SemverContext)
  ).pipe(
    mapTo({ success: true }),
    catchError((error) => {
      context.logger.error(error.stack ?? error.toString());
      context.reportStatus('Error');
      return of({ success: false });
    })
  );
}

export default createBuilder(runBuilder);
