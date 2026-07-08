import * as gitRawCommits from 'git-raw-commits';
import { exec } from '../../common/exec';
import { logStep } from './logger';

/**
 * Return the list of commit bodies since `since` commit.
 */
export function getCommits({
  projectRoot,
  since,
}: {
  projectRoot: string;
  since?: string;
}): Promise<string[]> {
  return getFormattedCommits({
    since,
    projectRoot,
    ignoreMergeCommits: true,
    format: '%B',
  });
}
/**
 * Return hash of last commit of a project
 */
export async function getLastCommitHash({
  projectRoot,
}: {
  projectRoot: string;
}): Promise<string> {
  const [commit] = await getFormattedCommits({
    projectRoot,
    ignoreMergeCommits: false,
    format: '%H',
  });
  return commit.trim();
}

function getFormattedCommits({
  projectRoot,
  format,
  ignoreMergeCommits,
  since = '',
}: {
  projectRoot: string;
  format: string;
  ignoreMergeCommits: boolean;
  since?: string;
}): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const params: Record<string, string | boolean> = {
      from: since,
      format,
      path: projectRoot,
      'full-history': true,
    };
    if (ignoreMergeCommits) {
      params['no-merges'] = ignoreMergeCommits;
    }

    const commits: string[] = [];

    gitRawCommits(params)
      .on('data', (data: string) => commits.push(data.toString()))
      .on('error', (error: Error) => reject(error))
      .on('close', () => resolve(commits))
      .on('finish', () => resolve(commits));
  });
}

export async function tryPush({
  remote,
  branch,
  noVerify,
  enforceAtomicPush,
  projectName,
  tag,
}: {
  tag: string;
  remote: string;
  branch: string;
  noVerify: boolean;
  enforceAtomicPush: boolean;
  projectName: string;
}): Promise<string> {
  if (remote == null || branch == null) {
    throw new Error(
      'Missing option --remote or --branch, see: https://github.com/jscutlery/semver#configure.',
    );
  }

  const gitPushOptions = [...(noVerify ? ['--no-verify'] : [])];

  let result: string;
  try {
    result = await exec('git', [
      'push',
      ...gitPushOptions,
      '--atomic',
      remote,
      branch,
      tag,
    ]);
  } catch (error) {
    if (!enforceAtomicPush && /atomic/.test(error as string)) {
      logStep({
        step: 'warning',
        level: 'warn',
        message: 'Git push --atomic failed, attempting non-atomic push.',
        projectName,
      });
      result = await exec('git', [
        'push',
        ...gitPushOptions,
        remote,
        branch,
        tag,
      ]);
    } else {
      throw error;
    }
  }

  logStep({
    step: 'push_success',
    message: `Pushed to "${remote}" "${branch}".`,
    projectName,
  });

  return result;
}

export async function addToStage({
  paths,
  dryRun,
  skipStage,
}: {
  paths: string[];
  dryRun: boolean;
  skipStage: boolean;
}): Promise<void> {
  if (paths.length === 0) {
    return;
  } else if (skipStage) {
    // skip stage and return like this to ensure the chain will continue.
    return;
  }

  const gitAddOptions = [...(dryRun ? ['--dry-run'] : []), ...paths];
  await exec('git', ['add', ...gitAddOptions]);
}

export async function getFirstCommitRef(): Promise<string> {
  const output = await exec('git', ['rev-list', '--max-parents=0', 'HEAD']);
  return (
    output
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean)
      .pop() ?? ''
  );
}

export async function createTag({
  dryRun,
  tag,
  commitHash,
  commitMessage,
  projectName,
  tagSign,
}: {
  dryRun: boolean;
  tag: string;
  commitHash: string;
  commitMessage: string;
  projectName: string;
  tagSign?: boolean;
}): Promise<string | undefined> {
  if (dryRun) {
    return undefined;
  }

  const gitTagOptions = [...(true === tagSign ? ['--sign'] : [])];

  try {
    await exec('git', [
      'tag',
      '-a',
      tag,
      commitHash,
      '-m',
      commitMessage,
      ...gitTagOptions,
    ]);
  } catch (error) {
    if (/already exists/.test(error as string)) {
      throw new Error(`Failed to tag "${tag}", this tag already exists.
            This error occurs because the same version was previously created but the tag does not point to a commit referenced in your base branch.
            Please delete the tag by running "git tag -d ${tag}", make sure the tag has been removed from the remote repository as well and run this command again.`);
    }

    throw error;
  }

  logStep({
    step: 'tag_success',
    message: `Tagged "${tag}".`,
    projectName,
  });

  return tag;
}
