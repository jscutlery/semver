import * as gitRawCommits from 'git-raw-commits';
import { defer, Observable, of, throwError } from 'rxjs';
import { catchError, last, scan, startWith, switchMap } from 'rxjs/operators';

import { execAsync } from './exec-async';

/**
 * Return the list of commits since `since` commit.
 */
export function getCommits({
  projectRoot,
  since,
}: {
  projectRoot: string;
  since: string;
}): Observable<string[]> {
  return new Observable<string>((observer) => {
    gitRawCommits({
      from: since,
      path: projectRoot,
    })
      .on('data', (data: string) => observer.next(data))
      .on('error', (error) => observer.error(error))
      .on('close', () => observer.complete())
      .on('finish', () => observer.complete());
  }).pipe(
    scan((commits, commit) => [...commits, commit], [] as string[]),
    startWith([]),
    last()
  );
}

export function tryPushToGitRemote({
  remote,
  branch,
  noVerify,
}: {
  remote: string;
  branch: string;
  noVerify: boolean;
}): Observable<{
  stderr: string;
  stdout: string;
}> {
  return defer(() => {
    if (remote == null || branch == null) {
      return throwError(
        new Error(
          'Missing Git options --remote or --branch, see: https://github.com/jscutlery/semver#configure'
        )
      );
    }

    const gitPushOptions = [
      '--follow-tags',
      ...(noVerify ? ['--no-verify'] : []),
    ];

    return execAsync('git', [
      'push',
      ...gitPushOptions,
      '--atomic',
      remote,
      branch,
    ]).pipe(
      catchError((error) => {
        if (
          /atomic/.test(error.stderr) ||
          (process.env.GIT_REDIRECT_STDERR === '2>&1' &&
            /atomic/.test(error.stdout))
        ) {
          console.warn('git push --atomic failed, attempting non-atomic push');

          return execAsync('git', ['push', ...gitPushOptions, remote, branch]);
        }

        return throwError(error);
      })
    );
  });
}

export function addToStage({
  paths,
  dryRun,
}: {
  paths: string[];
  dryRun: boolean;
}): Observable<{ stderr: string; stdout: string }> {
  return defer(() => {
    const gitAddOptions = [...(dryRun ? ['--dry-run'] : []), ...paths];
    return execAsync('git', ['add', ...gitAddOptions]);
  });
}

export function getLastTag(): Observable<string> {
  return execAsync('git', ['describe', '--tags', '--abbrev=0']).pipe(
    switchMap(({ stdout }) =>
      stdout ? of(stdout) : throwError(new Error('No tag found'))
    )
  );
}

export function getFirstCommitRef(): Observable<string> {
  return execAsync('git', ['rev-list', '--max-parents=0', 'HEAD']).pipe(
    /**                                 Remove line breaks. */
    switchMap(({ stdout }) => of(stdout.replace(/\r?\n|\r/, '')))
  );
}
