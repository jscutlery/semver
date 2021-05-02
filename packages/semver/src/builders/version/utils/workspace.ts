import { BuilderContext } from '@angular-devkit/architect';
import { resolve } from 'path';
import { defer, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export function getPackageFiles(projectsRoot: string[]): Observable<string[]> {
  return of(projectsRoot).pipe(
    map((projectRoots) =>
      projectRoots.map((projectRoot) =>
        resolve(projectRoot, 'package.json')
      )
    )
  );
}

export function getProjectRoot(context: BuilderContext): Observable<string> {
  return defer(
    async () => await context.getProjectMetadata(context.target.project)
  ).pipe(map(({ root }) => root as string));
}
