import { BuilderOutput } from '@angular-devkit/architect';
import { execSync } from 'child_process';
import { runBuilder } from './builder';
import {
  createFakeContext,
  setupTestingWorkspace,
  TestingWorkspace,
} from './testing';
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
          workspaceRoot: testingWorkspace.root,
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
});
