import { logger } from '@nrwl/devkit';
import * as gitRawCommits from 'git-raw-commits';
import { defer, EMPTY, Observable, throwError } from 'rxjs';
import { catchError, last, map, scan, startWith, tap } from 'rxjs/operators';

import { exec } from '../../common/exec';
import { resolveInterpolation } from './resolve-interpolation';
import { formatTag } from './tag';

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
      .on('error', (error: Error) => observer.error(error))
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
}): Observable<string> {
  return defer(() => {
    if (remote == null || branch == null) {
      return throwError(
        () =>
          new Error(
            'Missing Git options --remote or --branch, see: https://github.com/jscutlery/semver#configure'
          )
      );
    }

    const gitPushOptions = [
      '--follow-tags',
      ...(noVerify ? ['--no-verify'] : []),
    ];

    return exec('git', [
      'push',
      ...gitPushOptions,
      '--atomic',
      remote,
      branch,
    ]).pipe(
      catchError((error) => {
        if (
          /atomic/.test(error) ||
          (process.env.GIT_REDIRECT_STDERR === '2>&1' && /atomic/.test(error))
        ) {
          console.warn('git push --atomic failed, attempting non-atomic push');
          return exec('git', ['push', ...gitPushOptions, remote, branch]);
        }

        return throwError(() => error);
      })
    );
  }).pipe(tap(() => logger.log(`✅ Pushed to ${remote} ${branch}`)));
}

export function addToStage({
  paths,
  dryRun,
}: {
  paths: string[];
  dryRun: boolean;
}): Observable<void> {
  if (paths.length === 0) {
    return EMPTY;
  }

  const gitAddOptions = [...(dryRun ? ['--dry-run'] : []), ...paths];
  return exec('git', ['add', ...gitAddOptions]).pipe(map(() => undefined));
}

export function getFirstCommitRef(): Observable<string> {
  return exec('git', ['rev-list', '--max-parents=0', 'HEAD']).pipe(
    map((output) => output.trim())
  );
}

export function createTag({
  dryRun,
  version,
  tagPrefix,
  commitMessage,
}: {
  dryRun: boolean;
  version: string;
  tagPrefix: string;
  commitMessage: string;
}): Observable<string> {
  if (dryRun) {
    return EMPTY;
  }

  const tag = formatTag({ tagPrefix, version });
  return exec('git', ['tag', '-a', tag, '-m', commitMessage]).pipe(
    map(() => tag)
  );
}

export function commit({
  dryRun,
  version,
  noVerify,
  projectName,
  commitMessageFormat,
}: {
  dryRun: boolean;
  version: string;
  noVerify: boolean;
  projectName: string;
  commitMessageFormat: string;
}): Observable<void> {
  if (dryRun) {
    return EMPTY;
  }

  return exec('git', [
    'commit',
    ...(noVerify ? ['--no-verify'] : []),
    '-m',
    formatCommitMessage({ version, commitMessageFormat, projectName }),
  ]).pipe(map(() => undefined));
}

function formatCommitMessage({
  version,
  projectName,
  commitMessageFormat,
}: {
  version: string;
  projectName: string;
  commitMessageFormat: string;
}): string {
  return resolveInterpolation(commitMessageFormat, {
    version,
    projectName,
  }) as string;
}
