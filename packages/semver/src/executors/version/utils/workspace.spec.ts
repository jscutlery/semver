import * as fs from 'fs';
import { lastValueFrom } from 'rxjs';

import { getPackageFiles } from './workspace';

describe('getPackageFiles', () => {
  let fakeReadFile: jest.Mock;

  beforeEach(() => {
    fakeReadFile = jest.fn().mockResolvedValue(
      JSON.stringify({
        version: 1,
        projects: {
          a: {
            root: 'packages/a',
          },
          b: {
            root: 'packages/b',
          },
        },
      })
    );
    jest
      .spyOn(fs.promises, 'readFile')
      .mockImplementation(
        (...args: Parameters<typeof fs.promises.readFile>) => {
          return fakeReadFile(args);
        }
      );
  });

  afterEach(() =>
    (
      fs.promises.readFile as jest.MockedFunction<typeof fs.promises.readFile>
    ).mockRestore()
  );

  it('should read workspace definition from workspace.json', async () => {
    fakeReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        projects: {
          a: {
            root: 'packages/a',
          },
          b: {
            root: 'packages/b',
          },
        },
      })
    );

    expect(await lastValueFrom(getPackageFiles('/root'))).toEqual([
      '/root/packages/a/package.json',
      '/root/packages/b/package.json',
    ]);

    expect(fs.promises.readFile).toBeCalledTimes(1);
    expect(fs.promises.readFile).toBeCalledWith('/root/workspace.json', {
      encoding: 'utf-8',
    });
  });

  it('should fallback to angular.json if workspace.json is not found', async () => {
    fakeReadFile.mockImplementationOnce(() => {
      throw new Error('ENOENT, no such file or directory');
    });
    fakeReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        projects: {
          a: {
            root: 'packages/a',
          },
          b: {
            root: 'packages/b',
          },
        },
      })
    );

    expect(await lastValueFrom(getPackageFiles('/root'))).toEqual([
      '/root/packages/a/package.json',
      '/root/packages/b/package.json',
    ]);
    expect(fs.promises.readFile).toBeCalledTimes(2);
    expect(fs.promises.readFile).toHaveBeenNthCalledWith(
      1,
      '/root/workspace.json',
      { encoding: 'utf-8' }
    );
    expect(fs.promises.readFile).toHaveBeenNthCalledWith(
      2,
      '/root/angular.json',
      { encoding: 'utf-8' }
    );
  });

  it("should handle extracted project's configuration", async () => {
    fakeReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        projects: {
          a: 'packages/a',
          b: 'packages/b',
        },
      })
    );

    expect(await lastValueFrom(getPackageFiles('/root'))).toEqual([
      '/root/packages/a/package.json',
      '/root/packages/b/package.json',
    ]);
  });
});
