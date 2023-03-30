import { createProjectGraphAsync, ProjectGraph } from '@nrwl/devkit';
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
  private readonly projectGraphMock = createProjectGraphAsync as jest.Mock;

  constructor(
    readonly projectGraph: ProjectGraph,
    readonly virtualFs: DirectoryJSON,
    private readonly _cwd = '/tmp/project'
  ) {
    vol.fromJSON(virtualFs, this._cwd);
    this.projectGraphMock.mockResolvedValue(projectGraph);
  }

  readFile(path: string): Promise<string> {
    return fs.readFile(path, 'utf-8');
  }

  createGraph(): Promise<ProjectGraph> {
    return createProjectGraphAsync({
      exitOnError: true,
      resetDaemonClient: false,
    });
  }

  cwd(): string {
    return this._cwd;
  }

  teardown(): void {
    vol.reset();
    this.projectGraphMock.mockClear();
  }
}
