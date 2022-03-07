import * as fs from 'fs';
import { lastValueFrom } from 'rxjs';

import { readPackageJson } from './project';

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
