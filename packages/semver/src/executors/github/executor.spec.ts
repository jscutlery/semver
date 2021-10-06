import { of } from 'rxjs';

import { execAsync } from '../common/exec-async';
import executor from './executor';

import type { GithubExecutorSchema } from './schema';

jest.mock('../common/exec-async');

const options: GithubExecutorSchema = {
  tag: 'v1.0.0',
};

describe('@jscutlery/semver:github', () => {
  const mockExec = execAsync as jest.Mock;

  beforeEach(() => {
    mockExec.mockImplementation(() => {
      return of({
        stdout: 'success',
      });
    });
  });

  it('create release with specified tag', async () => {
    const output = await executor(options);

    expect(mockExec).toBeCalledWith('gh release create', ['v1.0.0']);
    expect(output.success).toBe(true);
  });

  it('create release with specified branch', async () => {
    const output = await executor({ ...options, branch: 'master' });

    expect(mockExec).toBeCalledWith(
      'gh release create',
      expect.arrayContaining(['master'])
    );
    expect(output.success).toBe(true);
  });
});
