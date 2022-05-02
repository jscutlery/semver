import { lastValueFrom, of } from 'rxjs';
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
      })
    ).toBe('chore(a): release 1.0.0');
  });
});

describe(commit.name, () => {
  afterEach(() => (cp.exec as jest.Mock).mockReset());

  beforeEach(() => jest.spyOn(cp, 'exec').mockReturnValue(of('success')));

  it('should commit', async () => {
    await lastValueFrom(
      commit({
        dryRun: false,
        noVerify: false,
        commitMessage: 'chore(release): 1.0.0',
        projectName: 'p',
      })
    );

    expect(cp.exec).toBeCalledWith(
      'git',
      expect.arrayContaining(['commit', '-m', 'chore(release): 1.0.0'])
    );
  });

  it('should skip with --dryRun', (done) => {
    commit({
      dryRun: true,
      noVerify: false,
      commitMessage: 'chore(release): 1.0.0',
      projectName: 'p',
    }).subscribe({
      complete: () => {
        expect(cp.exec).not.toBeCalled();
        done();
      },
    });
  });

  it('should pass --noVerify', async () => {
    await lastValueFrom(
      commit({
        dryRun: false,
        noVerify: true,
        commitMessage: 'chore(release): 1.0.0',
        projectName: 'p',
      })
    );

    expect(cp.exec).toBeCalledWith(
      'git',
      expect.arrayContaining(['--no-verify'])
    );
  });
});
