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

  it('create release with given tag', async () => {
    const output = await executor(options);

    expect(mockExec).toBeCalledWith('gh release create', ['v1.0.0']);
    expect(output.success).toBe(true);
  });
});
