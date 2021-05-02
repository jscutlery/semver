import { BuilderContext } from '@angular-devkit/architect';
import { resolve } from 'path';
import { defer, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * @internal
 */
export function getPackageFiles(projectsRoot: string[]): Observable<string[]> {
  return of(projectsRoot).pipe(
    map((projectsRoot) =>
      projectsRoot.map((projectRoot) =>
        resolve(projectRoot, 'package.json')
      )
    )
  );
}

/**
 * @internal
 */
export function getProjectRoot(context: BuilderContext): Observable<string> {
  return defer(
    async () => await context.getProjectMetadata(context.target.project)
  ).pipe(map(({ root }) => root as string));
}
