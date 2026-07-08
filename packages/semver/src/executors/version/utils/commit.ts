import { exec } from '../../common/exec';
import { logStep } from './logger';
import { createTemplateString } from './template-string';

export async function commit({
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
}): Promise<void> {
  if (dryRun || skipCommit) {
    return;
  }

  await exec('git', [
    'commit',
    ...(noVerify ? ['--no-verify'] : []),
    '-m',
    commitMessage,
  ]);

  logStep({
    step: 'commit_success',
    message: `Committed "${commitMessage}".`,
    projectName,
  });
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
