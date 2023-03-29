import { createProjectGraphAsync, ProjectGraph } from '@nrwl/devkit';
import * as fs from 'fs/promises';
import { DirectoryJSON, vol } from 'memfs';
import { DevkitContract } from '../release/devkit.contract';

const cwd = '/tmp/project';

jest.mock('process', () => ({ cwd: () => cwd }));
jest.mock('fs/promises', () => jest.requireActual('memfs').fs.promises);
jest.mock('@nrwl/devkit', () => ({
  ...jest.requireActual('@nrwl/devkit'),
  createProjectGraphAsync: jest.fn(),
}));

export class TestingDevkit implements DevkitContract {
  private readonly projectGraphMock = createProjectGraphAsync as jest.Mock;

  constructor(
    readonly projectGraph: ProjectGraph,
    readonly virtualFs: DirectoryJSON
  ) {
    vol.fromJSON(virtualFs, cwd);
    this.projectGraphMock.mockResolvedValue(projectGraph);
  }

  readFile(path: string, encoding: 'utf-8'): Promise<string> {
    return fs.readFile(path, encoding);
  }

  createProjectGraphAsync(): Promise<ProjectGraph> {
    return createProjectGraphAsync({
      exitOnError: true,
      resetDaemonClient: false,
    });
  }

  cwd(): string {
    return cwd;
  }

  teardown(): void {
    vol.reset();
    this.projectGraphMock.mockClear();
  }
}
