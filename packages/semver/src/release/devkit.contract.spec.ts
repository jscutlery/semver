import { createProjectGraphAsync, ProjectGraph } from '@nrwl/devkit';
import * as fs from 'fs/promises';
import { DirectoryJSON, vol } from 'memfs';
import { resolve } from 'path';
import { setupGitRepo } from '../testing';

const cwd = '/tmp/project';

jest.mock('process', () => ({ cwd: () => cwd }));
jest.mock('fs/promises', () => jest.requireActual('memfs').fs.promises);
jest.mock('@nrwl/devkit', () => ({
  ...jest.requireActual('@nrwl/devkit'),
  createProjectGraphAsync: jest.fn(),
}));

export interface DevkitContract {
  createProjectGraphAsync(options: {
    exitOnError: boolean;
    resetDaemonClient: boolean;
  }): Promise<ProjectGraph>;
  cwd(): string;
  readFile(path: string, encoding: string): Promise<string>;
}

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

describe('contract', () => {
  let testDevkit: TestingDevkit;

  beforeAll(async () => {
    await setupGitRepo({ cwd });
  });

  afterAll(() => {
    testDevkit.teardown();
  });

  describe('when semver.json does not exist or is invalid', () => {
    beforeEach(() => {
      testDevkit = new TestingDevkit(
        {
          nodes: {},
          dependencies: {},
        },
        {
          'semver.json': JSON.stringify({ value: 'JSON' }),
        }
      );
    });

    it('returns PWD', async () => {
      const result = await testDevkit.cwd();
      expect(result).toEqual('/tmp/project');
    });

    it('reads a JSON file', async () => {
      const result = await testDevkit.readFile(
        resolve(testDevkit.cwd(), 'semver.json'),
        'utf-8'
      );
      expect(result).toEqual(JSON.stringify({ value: 'JSON' }));
    });

    it('creates workspace graph', async () => {
      const result = await testDevkit.createProjectGraphAsync();
      expect(result).toEqual({
        nodes: {},
        dependencies: {},
      });
    });
  });
});
