import { callbackify } from 'util';
import { readPackageJson } from './project';
import * as fs from 'fs';

describe('readPackageJson', () => {
  it('should read package.json', async () => {
    jest.spyOn(fs, 'readFile').mockImplementation(
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      callbackify(jest.fn().mockResolvedValue(`{"version":"2.1.0"}`)) as any
    );

    const content = await readPackageJson('/root').lastValueFrom();
    expect(content).toEqual({
      version: '2.1.0',
    });
  });
});
