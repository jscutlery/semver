import { lastValueFrom } from 'rxjs';
import { exec } from './exec';

describe(exec.name, () => {
  it('should exec and return stdout', (done) => {
    const observer = {
      next: jest.fn(),
    };

    exec('node', ['--version']).subscribe({
      next: observer.next,
      error: done.fail,
      complete: () => {
        expect(observer.next).toBeCalledTimes(1);
        expect(observer.next).toBeCalledWith(expect.stringContaining('v'));
        done();
      },
    });
  });

  it('should handle failure and return stderr', async () => {
    await expect(
      lastValueFrom(exec('exit', ['1']))
    ).rejects.toThrowError();
  });
});
