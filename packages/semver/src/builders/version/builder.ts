import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { resolve } from 'path';
import { from, Observable, of } from 'rxjs';
import { catchError, mapTo, switchMap } from 'rxjs/operators';
import * as standardVersion from 'standard-version';

import { VersionBuilderSchema } from './schema';

async function getProjectRoot(context: BuilderContext): Promise<string> {
  const metadata = await context.getProjectMetadata(context.target.project);
  return metadata.root as string;
}

export function runBuilder(
  options: VersionBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  return from(getProjectRoot(context)).pipe(
    switchMap((projectRoot) =>
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
    ),
    mapTo({ success: true }),
    catchError(() => {
      context.reportStatus('Error');
      return of({ success: false });
    })
  );
}

export default createBuilder(runBuilder);
