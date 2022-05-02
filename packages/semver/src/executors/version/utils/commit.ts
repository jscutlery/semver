import { EMPTY, map, type Observable } from 'rxjs';
import { exec } from '../../common/exec';
import { logStep } from './logger';
import { createTemplateString } from './template-string';

export function commit({
  dryRun,
  noVerify,
  commitMessage,
  projectName,
}: {
  dryRun: boolean;
  noVerify: boolean;
  commitMessage: string;
  projectName: string;
}): Observable<void> {
  if (dryRun) {
    return EMPTY;
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
