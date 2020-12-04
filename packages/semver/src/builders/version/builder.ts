import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { resolve } from 'path';
import { from, Observable, of } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';
import * as standardVersion from 'standard-version';

import { VersionBuilderSchema } from './schema';

export function runBuilder(
  options: VersionBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  const projectRoot = resolve(context.workspaceRoot, options.root);
  return from(
    standardVersion({
      silent: false,
      path: projectRoot,
      dryRun: options.dryRun,
      noVerify: options.noVerify,
      firstRelease: options.firstRelease,
      infile: resolve(projectRoot, 'CHANGELOG.md'),
      packageFiles: [resolve(projectRoot, 'package.json')],
      bumpFiles: [resolve(projectRoot, 'package.json')],
    })
  ).pipe(
    mapTo({ success: true }),
    catchError(() => of({ success: false }))
  );
}

export default createBuilder(runBuilder);
