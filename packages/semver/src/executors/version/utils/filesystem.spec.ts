import * as fs from 'fs';

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

  it('should throw error', async () => {
    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file or directory'),
    );

    await expect(readJsonFile('/unexisting-file')).rejects.toThrow(
      'ENOENT: no such file or directory',
    );
    expect(mockReadFile).toHaveBeenCalledTimes(1);
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
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file or directory'),
    );

    expect(await readFileIfExists('/unexisting-file')).toBe('');
  });

  it('should return a fallback value if provided', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file or directory'),
    );

    expect(await readFileIfExists('/unexisting-file', 'some fallback')).toBe(
      'some fallback',
    );
  });
});
