import { of } from 'rxjs';
import { EMPTY, map, type Observable } from 'rxjs';
import { exec } from '../../common/exec';
import { logStep } from './logger';
import { createTemplateString } from './template-string';

export function commit({
  dryRun,
  noVerify,
  skipCommit,
  commitMessage,
  projectName,
}: {
  dryRun: boolean;
  skipCommit: boolean;
  noVerify: boolean;
  commitMessage: string;
  projectName: string;
}): Observable<void > {
  if (dryRun || skipCommit) {
    return of(undefined);
  }

  return exec('git', [
    'commit',
    ...(noVerify ? ['--no-verify'] : []),
    '-m',
    commitMessage,
  ]).pipe(
    map(() => undefined),
    logStep({
      step: 'commit_success',
      message: `Committed "${commitMessage}".`,
      projectName,
    })
  );
}

export function formatCommitMessage({
  commitMessageFormat,
  version,
  projectName,
}: {
  version: string;
  commitMessageFormat: string;
  projectName: string;
}): string {
  return createTemplateString(commitMessageFormat, {
    projectName,
    version,
  });
}
