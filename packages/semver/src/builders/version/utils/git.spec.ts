import * as gitRawCommits from 'git-raw-commits';
import { PassThrough } from 'stream';
import { getCommits } from './git';

jest.mock('git-raw-commits', () => jest.fn());

describe('git.getCommits', () => {
  const mockGitRawCommits = gitRawCommits as jest.Mock;

  it('should get commits list', () => {
    const stream = new PassThrough();
    mockGitRawCommits.mockReturnValue(stream);

    const observer = {
      next: jest.fn(),
      complete: jest.fn(),
    };

    getCommits({
      projectRoot: 'libs/demo',
      since: 'x1.0.0',
    }).subscribe(observer);

    stream.emit('data', 'feat A');
    stream.emit('data', 'feat B');
    stream.emit('close');

    expect(observer.next).toBeCalledTimes(1);
    expect(observer.next).toBeCalledWith(['feat A', 'feat B']);
    expect(observer.complete).toBeCalledTimes(1);
  });
});
