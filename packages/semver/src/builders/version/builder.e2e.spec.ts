import { BuilderOutput } from '@angular-devkit/architect';
import { fileExists } from '@nrwl/nx-plugin/testing';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { runBuilder } from './builder';
import {
  createFakeContext,
  setupTestingWorkspace,
  TestingWorkspace,
} from './testing';
import { readPackageJson } from './utils/project';

describe('@jscutlery/semver:version e2e', () => {
  beforeAll(() => jest.spyOn(console, 'info').mockImplementation());

  afterAll(() => (console.info as jest.Mock).mockRestore());

  describe('Sync mode with --rootChangelog true`', () => {
    let result: BuilderOutput;
    let testingWorkspace: TestingWorkspace;

    beforeAll(async () => {
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

      /* Commit changes. */
      execSync(
        `
          git init; 
          git add .; 
          git commit -m "feat: 🐣"; 
        `
      );

      /* Run builder. */
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

    afterAll(() => testingWorkspace.tearDown());

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should bump root package.json', async () => {
      expect((await readPackageJson('.').toPromise()).version).toEqual('0.1.0');
    });

    xit('🚧 should generate sub-changelogs', async () => {
      throw new Error('🚧 work in progress!');
    });

    xit('🚧 should generate root changelog', async () => {
      expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
        new RegExp(`^# Changelog

All notable changes to this project will be documented in this file. See .* for commit guidelines.

# 0.1.0 \\(.*\\)


### Features

\\* 🐣 .*
$`)
      );
    });
  });
});
