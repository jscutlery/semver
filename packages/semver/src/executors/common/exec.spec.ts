import { exec } from './exec';

describe(exec.name, () => {
  it('should exec and return stdout', async () => {
    const stdout = await exec('node', ['--version']);
    expect(stdout).toEqual(expect.stringContaining('v'));
  });

  it('should handle failure and return stderr', async () => {
    await expect(exec('exit', ['1'])).rejects.toThrow();
  });
});
