import type { GithubExecutorSchema } from './schema';
import executor from './executor';

const options: GithubExecutorSchema = {};

describe('Github Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});
