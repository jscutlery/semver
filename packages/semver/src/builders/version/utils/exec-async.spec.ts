import { execAsync } from './exec-async';

describe('execAsync', () => {
  it('should exec a command', async () => {
    const result = await execAsync('node', ['--version']);
    expect(result).toEqual(
      expect.objectContaining({
        stderr: '',
        stdout: expect.stringContaining('v'),
      })
    );
  });

  it('should handle failure', async () => {
    try {
      await execAsync('exit 1');
      fail();
    } catch (error) {
      expect(error).toEqual(
        expect.objectContaining({
          cmd: 'exit 1',
          stderr: '',
          stdout: '',
        })
      );
    }
  });
});
