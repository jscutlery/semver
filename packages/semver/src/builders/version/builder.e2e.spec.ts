import { BuilderOutput } from '@angular-devkit/architect';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import * as rimraf from 'rimraf';

import * as tmp from 'tmp';
import { promisify } from 'util';
import { runBuilder } from './builder';
import { readPackageJson } from './utils/project';

describe('@jscutlery/semver:version e2e', () => {
  let tmpDir;
  let tmpPath: string;

  beforeEach(() => {
    /* Create a temporary directory. */
    tmpDir = tmp.dirSync();

    /* Mock cwd. */
    process.chdir(tmpDir.name);
    /* Retrieving path from `process.cwd()`
     * because for some strange reasons it returns a different value.
     * Cf. https://github.com/nodejs/node/issues/7545 */
    tmpPath = process.cwd();

    /* Add package.json. */
    writeFileSync(
      resolve(tmpPath, 'package.json'),
      JSON.stringify({ version: '0.0.0' })
    );

    /* Add workspace.json. */
    writeFileSync(
      resolve(tmpPath, 'workspace.json'),
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
      })
    );

    mkdirSync(resolve(tmpPath, 'packages'));
    mkdirSync(resolve(tmpPath, 'packages', 'a'));
    mkdirSync(resolve(tmpPath, 'packages', 'b'));

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

  afterEach(() => promisify(rimraf)(tmpPath));

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
          projectRoot: tmpPath,
        })
      ).toPromise();
    });

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should bump root package.json', async () => {
      expect((await readPackageJson(tmpPath).toPromise()).version).toEqual(
        '0.1.0'
      );
    });
  });

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
      workspaceRoot: tmpPath,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } as any;
  }
});
