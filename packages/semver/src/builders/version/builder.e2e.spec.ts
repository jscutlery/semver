import { BuilderOutput } from '@angular-devkit/architect';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import * as rimraf from 'rimraf';

import * as tmp from 'tmp';
import { promisify } from 'util';
import { runBuilder } from './builder';
import { readPackageJson } from './utils/project';

describe('@jscutlery/semver:version e2e', () => {
  let testingWorkspace: TestingWorkspace;

  beforeEach(() => {
    testingWorkspace = setupTestingWorkspace(
      new Map([
        ['package.json', JSON.stringify({ version: '0.0.0' })],
        [
          'workspace.json',
          JSON.stringify({
            projects: {
              workspace: {
                root: '.',
              },
              a: {
                root: 'packages/a',
              },
              b: {
                root: 'packages/b',
              },
            },
          }),
        ],
        ['packages/a/.gitkeep', ''],
        ['packages/b/.gitkeep', ''],
      ])
    );

    execSync(
      `
      git init; 
      git add .; 
      git commit -m "feat: 🐣"; 
    `
    );
  });

  beforeEach(() => jest.spyOn(console, 'info').mockImplementation());

  afterEach(() => (console.info as jest.Mock).mockRestore());

  afterEach(() => testingWorkspace.tearDown());

  describe('Sync mode', () => {
    let result: BuilderOutput;

    beforeEach(async () => {
      result = await runBuilder(
        {
          dryRun: false,
          noVerify: false,
          push: false,
          remote: 'origin',
          baseBranch: 'main',
          rootChangelog: true,
          syncVersions: true,
        },
        createFakeContext({
          project: 'workspace',
          projectRoot: testingWorkspace.root,
        })
      ).toPromise();
    });

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should bump root package.json', async () => {
      expect(
        (await readPackageJson(testingWorkspace.root).toPromise()).version
      ).toEqual('0.1.0');
    });
  });

  interface TestingWorkspace {
    tearDown(): Promise<void>;
    root: string;
  }

  function setupTestingWorkspace(files: Map<string, string>): TestingWorkspace {
    /* Create a temporary directory. */
    const tmpDir = tmp.dirSync();

    for (const [fileRelativePath, content] of files.entries()) {
      const filePath = resolve(tmpDir.name, fileRelativePath);
      const directory = dirname(filePath);
      /* Create path. */
      mkdirSync(directory, { recursive: true });
      /* Create file. */
      writeFileSync(filePath, content, 'utf-8');
    }

    const originalCwd = process.cwd();
    process.chdir(tmpDir.name);

    /* Retrieving path from `process.cwd()`
     * because for some strange reasons it returns a different value.
     * Cf. https://github.com/nodejs/node/issues/7545 */
    const workspaceRoot = process.cwd();

    return {
      /**
       * Destroy and restore cwd.
       */
      async tearDown() {
        await promisify(rimraf)(workspaceRoot);
        process.chdir(originalCwd);
      },
      root: workspaceRoot,
    };
  }

  function createFakeContext({
    project,
    projectRoot,
  }: {
    project: string;
    projectRoot: string;
  }) {
    return {
      getProjectMetadata: jest.fn().mockReturnValue({ root: projectRoot }),
      logger: { error: jest.fn() },
      reportStatus: jest.fn(),
      target: {
        project,
      },
      workspaceRoot: testingWorkspace.root,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } as any;
  }
});
