import * as gitRawCommits from 'git-raw-commits';
import { Observable } from 'rxjs';
import { last, scan, startWith } from 'rxjs/operators';

import { execAsync } from './exec-async';

/**
 * Return the list of commits since `since` commit.
 * @internal
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

/**
 * @internal
 */
export async function tryPushToGitRemote({
  remote,
  branch,
  noVerify,
}: {
  remote: string;
  branch: string;
  noVerify: boolean;
}) {
  if (remote == null || branch == null) {
    throw new Error(
      'Missing Git options --remote or --branch, see: https://github.com/jscutlery/semver#configure'
    );
  }

  const gitPushOptions = [
    '--follow-tags',
    ...(noVerify ? ['--no-verify'] : []),
  ];

  try {
    const result = await execAsync('git', [
      'push',
      ...gitPushOptions,
      '--atomic',
      remote,
      branch,
    ]);

    return result;
  } catch (error) {
    if (/atomic/.test(error.stderr)) {
      console.warn('git push --atomic failed, attempting non-atomic push');
      return execAsync('git', ['push', ...gitPushOptions, remote, branch]);
    }

    throw error;
  }
}

/**
 * @internal
 */
export function addToStage({
  paths,
  dryRun,
}: {
  paths: string[];
  dryRun: boolean;
}) {
  if (paths.length === 0) {
    return Promise.resolve();
  }

  const gitAddOptions = [...(dryRun ? ['--dry-run'] : []), ...paths];
  return execAsync('git', ['add', ...gitAddOptions]);
}

/**
 * @internal
 */
export async function getFirstCommitRef(): Promise<string> {
  const { stdout } = await execAsync('git', [
    'rev-list',
    '--max-parents=0',
    'HEAD',
  ]);
  /* remove line breaks. */
  return stdout.replace(/\r?\n|\r/, '');
}
