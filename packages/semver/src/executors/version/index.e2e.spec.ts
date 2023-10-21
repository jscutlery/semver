import { execSync } from 'child_process';
import { setupTestingWorkspace, type TestingWorkspace } from './testing';
import { readFileSync } from 'fs';

describe('@jscutlery/semver', () => {
  let testingWorkspace: TestingWorkspace;

  describe('package "a"', () => {
    beforeAll(async () => {
      testingWorkspace = setupTestingWorkspace();
      testingWorkspace.run(
        `g @nx/js:lib a --directory=libs --unitTestRunner=none --linter=none --bundler=none --minimal --publishable --importPath=@proj/a`,
      );
      testingWorkspace.run(`g @jscutlery/semver:install --projects=a`);

      initGit(testingWorkspace.root);
      createAndCommitFiles(testingWorkspace.root);

      testingWorkspace.run(`run a:version`);
    });

    afterAll(() => testingWorkspace.tearDown());

    it('should commit all changes', () => {
      expect(uncommitedChanges(testingWorkspace.root)).toHaveLength(0);
    });

    it('should tag a-0.1.0', () => {
      expect(getLastTag(testingWorkspace.root)).toBe('a-0.1.0');
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
  }).trim();
}

function createAndCommitFiles(dir: string) {
  execSync(
    `
        echo feat > libs/a/a.txt
        git add .
        git commit -m "feat(a): 🚀 new feature"

        echo fix >> libs/a/a.txt
        git add .
        git commit -m "fix(a): 🐞 fix bug"
      `,
    { cwd: dir, stdio: 'ignore' },
  );
}

function initGit(dir: string) {
  execSync(
    `
        git init --quiet

        # These are needed by CI.
        git config user.email "bot@jest.io"
        git config user.name "Test Bot"

        git config commit.gpgsign false

        git add .
        git commit -m "🐣"
`,
    { cwd: dir, stdio: 'ignore' },
  );
}

function readFile(path: string) {
  return readFileSync(path, {
    encoding: 'utf-8',
  });
}

function uncommitedChanges(dir: string) {
  return (
    execSync('git status --porcelain', { encoding: 'utf-8', cwd: dir })
      .split('\n')
      /* Remove empty line. */
      .filter((line) => line.length !== 0)
  );
}
