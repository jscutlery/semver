import * as fs from 'fs/promises';
import { DirectoryJSON, vol } from 'memfs';
import { Devkit } from '../release/devkit';

const cwd = '/tmp/project';

jest.mock('process', () => ({ cwd: () => cwd }));
jest.mock('fs/promises', () => jest.requireActual('memfs').fs.promises);

export class TestingDevkit implements Devkit {
  constructor(
    readonly virtualFs: DirectoryJSON,
    private readonly _cwd = '/tmp/project'
  ) {
    vol.fromJSON(virtualFs, this._cwd);
  }

  readFile(path: string): Promise<string> {
    return fs.readFile(path, 'utf-8');
  }

  cwd(): string {
    return this._cwd;
  }

  teardown(): void {
    vol.reset();
  }
}
