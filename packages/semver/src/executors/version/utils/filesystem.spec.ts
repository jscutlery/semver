import * as fs from 'fs';
import { lastValueFrom } from 'rxjs';

import { readFileIfExists, readJsonFile } from './filesystem';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockResolvedValue(() => Promise.resolve()),
    access: jest.fn().mockResolvedValue(() => Promise.resolve()),
  },
}));

const fsPromises = fs.promises;

describe('readJsonFile', () => {
  const mockReadFile = fsPromises.readFile as jest.Mock;

  afterEach(() => {
    mockReadFile.mockReset();
  });

  it('should emit error', async () => {
    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file or directory'),
    );

    const file$ = readJsonFile('/unexisting-file');

    /* Wait for all microtasks to finish. */
    /* We want to make sure that `fs.readFile` is not called
     * before we subscribe, otherwise the error is not handled. */
    await new Promise(setImmediate);

    await expect(lastValueFrom(file$)).rejects.toThrow(
      'ENOENT: no such file or directory',
    );
    expect(mockReadFile).toBeCalledTimes(1);
  });
});

describe('readFileIfExists', () => {
  const mockReadFile = fsPromises.readFile as jest.Mock;
  const mockAccess = fsPromises.access as jest.Mock;

  afterEach(() => {
    mockReadFile.mockReset();
    mockAccess.mockReset();
  });

  it('should return an empty string if the file does not exists', async () => {
    mockAccess.mockResolvedValue(false);

    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file or directory'),
    );

    const file$ = readFileIfExists('/unexisting-file');

    /* Wait for all microtasks to finish. */
    /* We want to make sure that `fs.readFile` is not called
     * before we subscribe, otherwise the error is not handled. */
    await new Promise(setImmediate);

    expect(await lastValueFrom(file$)).toBe('');
  });

  it('should return a fallback value if provided', async () => {
    mockAccess.mockResolvedValue(false);

    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file or directory'),
    );

    const file$ = readFileIfExists('/unexisting-file', 'some fallback');

    /* Wait for all microtasks to finish. */
    /* We want to make sure that `fs.readFile` is not called
     * before we subscribe, otherwise the error is not handled. */
    await new Promise(setImmediate);

    expect(await lastValueFrom(file$)).toBe('some fallback');
  });
});
