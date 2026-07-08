import * as cp from '../../common/exec';
import { commit, formatCommitMessage } from './commit';

jest.mock('../../common/exec');

jest.spyOn(console, 'log').mockImplementation();

describe(formatCommitMessage.name, () => {
  it('should format commit message with projectName and version', () => {
    expect(
      formatCommitMessage({
        commitMessageFormat: 'chore(${projectName}): release ${version}',
        version: '1.0.0',
        projectName: 'a',
      }),
    ).toBe('chore(a): release 1.0.0');
  });
});

describe(commit.name, () => {
  afterEach(() => (cp.exec as jest.Mock).mockReset());

  beforeEach(() => jest.spyOn(cp, 'exec').mockResolvedValue('success'));

  it('should commit', async () => {
    await commit({
      dryRun: false,
      noVerify: false,
      skipCommit: false,
      commitMessage: 'chore(release): 1.0.0',
      projectName: 'p',
    });

    expect(cp.exec).toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['commit', '-m', 'chore(release): 1.0.0']),
    );
  });

  it('should skip with --dryRun', async () => {
    await commit({
      dryRun: true,
      noVerify: false,
      skipCommit: false,
      commitMessage: 'chore(release): 1.0.0',
      projectName: 'p',
    });

    expect(cp.exec).not.toHaveBeenCalled();
  });

  it('should skip commit with --skipCommit', async () => {
    await commit({
      dryRun: false,
      noVerify: false,
      skipCommit: true,
      commitMessage: 'chore(release): 1.0.0',
      projectName: 'p',
    });

    expect(cp.exec).not.toHaveBeenCalled();
  });

  it('should pass --noVerify', async () => {
    await commit({
      dryRun: false,
      noVerify: true,
      skipCommit: false,
      commitMessage: 'chore(release): 1.0.0',
      projectName: 'p',
    });

    expect(cp.exec).toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['--no-verify']),
    );
  });
});
