import { execSync } from 'child_process';
import { setupTestingWorkspace, type TestingWorkspace } from './testing';
import { readFileSync } from 'fs';

describe('@jscutlery/semver', () => {
  let testingWorkspace: TestingWorkspace;

  describe('package "a"', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace();
      testingWorkspace.runNx(
        `g @nx/js:lib a --directory=libs --unitTestRunner=none --linter=none --bundler=none --minimal --publishable --importPath=@proj/a`,
      );
      testingWorkspace.exec(
        `
          git add .
          git commit -m "🐣"
        `,
      );
      testingWorkspace.runNx(`g @jscutlery/semver:install --projects=a`);
      testingWorkspace.exec(
        `
          git add .
          git commit -m "build: 📦 setup semver"
        `,
      );
      testingWorkspace.exec(
        `
          echo feat > libs/a/a.txt
          git add .
          git commit -m "feat(a): 🚀 new feature"

          echo fix >> libs/a/a.txt
          git add .
          git commit -m "fix(a): 🐞 fix bug"
        `,
      );
      // @TODO: Remove --noVerify when "release" commit type is allowed by commitlint.
      testingWorkspace.runNx(`run a:version --noVerify`);
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should commit all changes', () => {
      expect(uncommitedChanges(testingWorkspace.root)).toHaveLength(0);
    });

    it('should tag with version', () => {
      expect(getLastTag(testingWorkspace.root)).toBe('a-0.1.0');
    });

    it('should create only one tag', () => {
      expect(getTags(testingWorkspace.root)).toHaveLength(1);
    });

    it('should commit with description', () => {
      expect(getLastCommitDescription(testingWorkspace.root)).toBe(
        'chore(a): release version 0.1.0',
      );
    });

    it('should bump package version', () => {
      expect(readFile(`${testingWorkspace.root}/libs/a/package.json`)).toMatch(
        /"version": "0.1.0"/,
      );
    });

    it('should generate CHANGELOG.md', () => {
      expect(readFile(`${testingWorkspace.root}/libs/a/CHANGELOG.md`)).toMatch(
        new RegExp(`^# Changelog

This file was generated.*

# 0.1.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*a:\\*\\* 🐞 fix bug .*


### Features

\\* \\*\\*a:\\*\\* 🚀 new feature .*
$`),
      );
    });
  });
});

function getLastTag(dir: string) {
  return execSync('git describe --tags --abbrev=0', {
    encoding: 'utf-8',
    cwd: dir,
    stdio: 'ignore',
  }).trim();
}

function getLastCommitDescription(dir: string) {
  return execSync('git log -1 --pretty=%B', {
    encoding: 'utf-8',
    cwd: dir,
    stdio: 'ignore',
  }).trim();
}

function getTags(dir: string) {
  return execSync('git tag', {
    encoding: 'utf-8',
    cwd: dir,
    stdio: 'ignore',
  })
    .trim()
    .split('\n');
}

function readFile(path: string) {
  return readFileSync(path, {
    encoding: 'utf-8',
  });
}

function uncommitedChanges(dir: string) {
  return (
    execSync('git status --porcelain', {
      encoding: 'utf-8',
      cwd: dir,
    })
      .split('\n')
      /* Remove empty line. */
      .filter((line) => line.length !== 0)
  );
}
