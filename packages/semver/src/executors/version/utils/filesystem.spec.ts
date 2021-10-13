import * as fs from 'fs';
import { callbackify } from 'util';
import { readJsonFile } from './filesystem';
import { lastValueFrom } from 'rxjs';


jest.mock('fs');

describe('readJsonFile', () => {
  let mockReadFile: jest.Mock;

  beforeEach(() => {
    mockReadFile = jest.fn();
    jest
      .spyOn(fs, 'readFile')
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      .mockImplementation(callbackify(mockReadFile) as any);
  });

  it('should emit error', async () => {
    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file or directory')
    );

    const file$ = readJsonFile('/unexisting-file');

    /* Wait for all microtasks to finish. */
    /* We want to make sure that `fs.readFile` is not called
     * before we subscribe, otherwise the error is not handled. */
    await new Promise(setImmediate);

    await lastValueFrom(expect(file$).rejects.toThrow(
      'ENOENT: no such file or directory'
    ))
    expect(mockReadFile).toBeCalledTimes(1);
  });
});
