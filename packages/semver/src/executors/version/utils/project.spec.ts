import * as fs from 'fs';
import { lastValueFrom } from 'rxjs';

import {
  readPackageJson,
  updateCustomJson,
  updateCustomJsons,
} from './project';
import { PathLike } from 'fs';
import { FileHandle } from 'fs/promises';
import { Stream } from 'stream';

const fsPromises = fs.promises;

describe('readPackageJson', () => {
  it('should read package.json', async () => {
    jest.spyOn(fsPromises, 'readFile').mockResolvedValue(`{"version":"2.1.0"}`);

    const content = await lastValueFrom(readPackageJson('/root'));
    expect(content).toEqual({
      version: '2.1.0',
    });
  });
});

describe('Update custom version into json', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update version in JSON content - variant 1', async () => {
    jest.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
    jest
      .spyOn(fsPromises, 'readFile')
      .mockResolvedValue(`{"info":{"version":"2.1.0"}}`);
    jest
      .spyOn(fsPromises, 'writeFile')
      .mockImplementation(
        async (
          file: PathLike | FileHandle,
          data:
            | string
            | NodeJS.ArrayBufferView
            | Iterable<string | NodeJS.ArrayBufferView>
            | AsyncIterable<string | NodeJS.ArrayBufferView>
            | Stream
        ) => {
          expect(data).toBe(`{"info":{"version":"1.2.3"}}\n`);
          return;
        }
      );
    const s = updateCustomJson({
      newVersion: '1.2.3',
      projectName: 'test',
      dryRun: false,
      projectRoot: 'test',
      customJsonPath: 'src/version.json:info.version',
    });
    await lastValueFrom(s);
  });

  it('should return null on dryRun', async () => {
    const s = updateCustomJson({
      newVersion: '1.2.3',
      projectName: 'test',
      dryRun: true,
      projectRoot: 'test',
      customJsonPath: 'src/version.json:info.version',
    });

    const resp = await lastValueFrom(s);
    expect(resp).toBe(null);
  });

  it('should return null if file is empty or does not exist', async () => {
    jest.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
    jest.spyOn(fsPromises, 'readFile').mockResolvedValue(``);

    const s = updateCustomJson({
      newVersion: '1.2.3',
      projectName: 'test',
      dryRun: false,
      projectRoot: 'test',
      customJsonPath: 'src/version.json:info.version',
    });
    const resp = await lastValueFrom(s);
    expect(resp).toBe(null);
  });

  it('should return empty array on undefined customJsonPaths', async () => {
    const s = updateCustomJsons({
      newVersion: '1.2.3',
      projectName: 'test',
      dryRun: false,
      projectRoot: 'test',
    });

    const resp = await lastValueFrom(s);
    expect(resp).toBeArrayOfSize(0);
  });

  it('should update version in multiple JSON contents', async () => {
    const result: string[] = [];
    jest.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
    jest
      .spyOn(fsPromises, 'readFile')
      .mockImplementation(async (path: PathLike | FileHandle) => {
        if (path.toString().includes('file1.json')) {
          return '{"version":"0.0.0"}';
        }
        if (path.toString().includes('file2.json')) {
          return '{"info":{"version":"0.0.0"}}';
        }
        return '';
      });
    jest
      .spyOn(fsPromises, 'writeFile')
      .mockImplementation(
        async (
          file: PathLike | FileHandle,
          data:
            | string
            | NodeJS.ArrayBufferView
            | Iterable<string | NodeJS.ArrayBufferView>
            | AsyncIterable<string | NodeJS.ArrayBufferView>
            | Stream
        ) => {
          if (file.toString().includes('file1.json')) {
            result.push(data as string);
          }
          if (file.toString().includes('file2.json')) {
            result.push(data as string);
          }
        }
      );

    const s = updateCustomJsons({
      newVersion: '1.2.3',
      projectName: 'test',
      dryRun: false,
      projectRoot: 'test',
      customJsonPaths: [
        'src/file1.json:version',
        'src/file2.json:info.version',
      ],
    });
    await lastValueFrom(s);

    expect(result).toContainAllValues([
      '{"version":"1.2.3"}\n',
      '{"info":{"version":"1.2.3"}}\n',
    ]);
  });

  it('should not touch file and should return empty array on dryRun', async () => {
    const mock = jest.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
    const s = updateCustomJsons({
      newVersion: '1.2.3',
      projectName: 'test',
      dryRun: true,
      projectRoot: 'test',
      customJsonPaths: [
        'src/file1.json:version',
        'src/file2.json:info.version',
      ],
    });

    const resp = await lastValueFrom(s);
    expect(mock).not.toBeCalled();
    expect(resp).toBeArrayOfSize(0);
  });
});
