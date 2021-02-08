import { _execAsync, execAsync } from './exec-async';

describe('execAsync (Observable)', () => {
  it('should exec a command', (done) => {
    const observer = {
      next: jest.fn(),
    };

    execAsync('node', ['--version']).subscribe({
      next: observer.next,
      error: fail,
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

describe('_execAsync (Promise)', () => {
  it('should exec a command', async () => {
    const result = await _execAsync('node', ['--version']);
    expect(result).toEqual(
      expect.objectContaining({
        stderr: '',
        stdout: expect.stringContaining('v'),
      })
    );
  });
});
