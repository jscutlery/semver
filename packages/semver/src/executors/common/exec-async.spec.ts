import { _execFile, execAsync } from '../common/exec-async';

describe('execAsync (Observable)', () => {
  it('should exec a command', (done) => {
    const observer = {
      next: jest.fn(),
    };

    execAsync('node', ['--version']).subscribe({
      next: observer.next,
      error: done.fail,
      complete: () => {
        expect(observer.next).toBeCalledTimes(1);
        expect(observer.next).toBeCalledWith(
          expect.objectContaining({
            stderr: '',
            stdout: expect.stringContaining('v'),
          })
        );
        done();
      },
    });
  });
});

describe('_execFile (Promise)', () => {
  it('should exec a command', async () => {
    const result = await _execFile('node', ['--version']);
    expect(result).toEqual(
      expect.objectContaining({
        stderr: '',
        stdout: expect.stringContaining('v'),
      })
    );
  });

  it('should escape string', async () => {
    const result = await _execFile('echo', ['--arg', '`--arg`']);
    expect(result).toEqual(
      expect.objectContaining({
        stderr: '',
        stdout: expect.stringMatching('--arg `--arg`'),
      })
    );
  });

  it('should handle failure', async () => {
    await expect(_execFile('exit 1')).rejects.toEqual(
      expect.objectContaining({
        stderr: '',
        stdout: '',
      })
    );
  });
});
