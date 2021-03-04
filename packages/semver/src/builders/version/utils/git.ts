import * as gitRawCommits from 'git-raw-commits';
import { defer, Observable, throwError } from 'rxjs';
import { catchError, last, scan, startWith } from 'rxjs/operators';

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
        new Error('Missing Git options --remote or --branch, see: https://github.com/jscutlery/semver#configure')
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
          console.warn(
            'git push --atomic failed, attempting non-atomic push'
          );

          return execAsync('git', ['push', ...gitPushOptions, remote, branch]);
        }

        return throwError(error);
      })
    );
  });
}

export function gitAdd(
  paths: string[],
  dryRun = false
): Observable<{ stderr: string; stdout: string }> {
  return defer(() => {
    const gitAddOptions = [...(dryRun ? ['--dry-run'] : []), ...paths];
    return execAsync('git', ['add', ...gitAddOptions]);
  });
}