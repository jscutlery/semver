import { exec } from './utils/exec';

export async function setupGitRepo({ cwd = '/tmp/project' }): Promise<void> {
  await exec('mkdir', ['-p', cwd]);
  await exec('git', ['init'], { cwd });
  await exec('git', ['config', 'user.email', 'test@email.com', '--local'], {
    cwd,
  });
  await exec('git', ['config', 'user.name', 'test', '--local'], { cwd });
  await exec(
    'git',
    ['commit', '--allow-empty', '-m', 'init', '--no-gpg-sign'],
    { cwd }
  );
}
