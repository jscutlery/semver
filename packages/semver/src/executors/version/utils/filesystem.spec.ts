import * as fs from 'fs';
import { lastValueFrom } from 'rxjs';
import { callbackify } from 'util';
import { readFileIfExists, readJsonFile } from './filesystem';

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

    await expect(lastValueFrom(file$)).rejects.toThrow(
      'ENOENT: no such file or directory'
    );
    expect(mockReadFile).toBeCalledTimes(1);
  });
});


describe('readFileIfExists', () => {
  let mockExists: jest.Mock;
  let mockReadFile: jest.Mock;

  beforeEach(() => {
    mockReadFile = jest.fn();
    jest
      .spyOn(fs, 'readFile')
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      .mockImplementation(callbackify(mockReadFile) as any);

    mockExists = jest.fn();
    jest
      .spyOn(fs, 'exists')
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      .mockImplementation(callbackify(mockExists) as any);
  });

  it('should return an empty string if the file does not exists', async () => {
    mockExists.mockResolvedValue(false);

    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file or directory')
    );

    const file$ = readFileIfExists('/unexisting-file');

    /* Wait for all microtasks to finish. */
    /* We want to make sure that `fs.readFile` is not called
     * before we subscribe, otherwise the error is not handled. */
    await new Promise(setImmediate);

    expect(await lastValueFrom(file$)).toBe('');
  });

  it('should return a fallback value if provided', async () => {
    mockExists.mockResolvedValue(false);

    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file or directory')
    );

    const file$ = readFileIfExists('/unexisting-file', 'some fallback');

    /* Wait for all microtasks to finish. */
    /* We want to make sure that `fs.readFile` is not called
     * before we subscribe, otherwise the error is not handled. */
    await new Promise(setImmediate);

    expect(await lastValueFrom(file$)).toBe('some fallback');
  });
});