import { ProjectGraph } from '@nrwl/devkit';
import * as fs from 'fs/promises';
import { DirectoryJSON, vol } from 'memfs';
import { Devkit } from '../release/devkit';

const cwd = '/tmp/project';

jest.mock('process', () => ({ cwd: () => cwd }));
jest.mock('fs/promises', () => jest.requireActual('memfs').fs.promises);
jest.mock('@nrwl/devkit', () => ({
  ...jest.requireActual('@nrwl/devkit'),
  createProjectGraphAsync: jest.fn(),
}));

export class TestingDevkit implements Devkit {
  constructor(
    readonly virtualFs: DirectoryJSON,
    readonly graph: ProjectGraph,
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

  async createGraph() {
    return this.graph;
  }

  teardown(): void {
    vol.reset();
  }
}
