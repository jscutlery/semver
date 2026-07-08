import { lastValueFrom, of, throwError } from 'rxjs';
import * as cp from '../../common/exec';
import { verifyNpmAuth } from './npm';

jest.mock('../../common/exec');

jest.spyOn(console, 'log').mockImplementation();

describe(verifyNpmAuth.name, () => {
  afterEach(() => (cp.exec as jest.Mock).mockReset());

  it('should run "npm whoami"', async () => {
    jest.spyOn(cp, 'exec').mockReturnValue(of('jscutlery'));

    await lastValueFrom(verifyNpmAuth({ projectName: 'p' }));

    expect(cp.exec).toHaveBeenCalledWith('npm', ['whoami']);
  });

  it('should throw a descriptive error when authentication fails', async () => {
    jest
      .spyOn(cp, 'exec')
      .mockReturnValue(throwError(() => new Error('ENEEDAUTH')));

    await expect(
      lastValueFrom(verifyNpmAuth({ projectName: 'p' })),
    ).rejects.toThrow(/Failed to authenticate with the npm registry/);
  });
});
