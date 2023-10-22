import { execSync } from 'child_process';
import { setupTestingWorkspace, type TestingWorkspace } from './testing';
import { readFileSync, existsSync } from 'fs';

describe('@jscutlery/semver', () => {
  let testingWorkspace: TestingWorkspace;

  beforeAll(() => {
    testingWorkspace = setupTestingWorkspace();
    // Lib a is publishable.
    testingWorkspace.runNx(
      `g @nx/js:lib a --directory=libs --unitTestRunner=none --linter=none --bundler=none --minimal --publishable --importPath=@proj/a`,
    );
    // Lib b is publishable.
    testingWorkspace.runNx(
      `g @nx/js:lib b --directory=libs --unitTestRunner=none --linter=none --bundler=none --minimal --publishable --importPath=@proj/b`,
    );
    // Lib c is not publishable.
    testingWorkspace.runNx(
      `g @nx/js:lib c --directory=libs --unitTestRunner=none --linter=none --bundler=none --minimal`,
    );
    testingWorkspace.exec(
      `
          git add .
          git commit -m "🐣"
      `,
    );
    testingWorkspace.runNx(`g @jscutlery/semver:install --projects=a,b`);
    testingWorkspace.exec(
      `
          git add .
          git commit -m "build: 📦 setup semver"
      `,
    );
  });

  afterAll(() => testingWorkspace.tearDown());

  describe('@jscutlery/semver:install', () => {
    it('should add commitlint config', () => {
      expect(existsSync(`${testingWorkspace.root}/.commitlintrc.json`)).toBe(
        true,
      );
    });

    it('should add commitlint config', () => {
      expect(readFile(`${testingWorkspace.root}/package.json`)).toMatch(
        /@commitlint\/config-angular/,
      );
    });

    it('should add commitlint CLI', () => {
      expect(readFile(`${testingWorkspace.root}/package.json`)).toMatch(
        /@commitlint\/cli/,
      );
    });
  });

  describe('@jscutlery/semver:version', () => {
    describe('when libs/a changed', () => {
      beforeAll(() => {
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
        testingWorkspace.runNx(`run a:version --noVerify`);
      });

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
        expect(
          readFile(`${testingWorkspace.root}/libs/a/package.json`),
        ).toMatch(/"version": "0.1.0"/);
      });

      it('should generate CHANGELOG.md', () => {
        expect(
          readFile(`${testingWorkspace.root}/libs/a/CHANGELOG.md`),
        ).toMatch(
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

    describe('when libs/b changed', () => {
      beforeAll(() => {
        testingWorkspace.exec(
          `
              echo feat > libs/b/b.txt
              git add .
              git commit -m "feat(b): 🚀 new feature"

              echo fix >> libs/b/b.txt
              git add .
              git commit -m "fix(b): 🐞 fix bug"
            `,
        );
        testingWorkspace.runNx(`run b:version --noVerify`);
      });

      it('should commit all changes', () => {
        expect(uncommitedChanges(testingWorkspace.root)).toHaveLength(0);
      });

      it('should tag with version', () => {
        expect(getLastTag(testingWorkspace.root)).toBe('b-0.1.0');
      });

      it('should create second tag', () => {
        expect(getTags(testingWorkspace.root)).toHaveLength(2);
      });

      it('should commit with description', () => {
        expect(getLastCommitDescription(testingWorkspace.root)).toBe(
          'chore(b): release version 0.1.0',
        );
      });

      it('should bump package version', () => {
        expect(
          readFile(`${testingWorkspace.root}/libs/b/package.json`),
        ).toMatch(/"version": "0.1.0"/);
      });

      it('should generate CHANGELOG.md', () => {
        expect(
          readFile(`${testingWorkspace.root}/libs/b/CHANGELOG.md`),
        ).toMatch(
          new RegExp(`^# Changelog

This file was generated.*

# 0.1.0 \\(.*\\)


### Bug Fixes

\\* \\*\\*b:\\*\\* 🐞 fix bug .*


### Features

\\* \\*\\*b:\\*\\* 🚀 new feature .*
$`),
        );
      });
    });

    describe('when libs/c did not change', () => {
      it('should not create a tag', () => {
        expect(getTags(testingWorkspace.root)).not.toInclude(
          expect.stringContaining('c'),
        );
      });

      it('should not generate CHANGELOG.md', () => {
        expect(existsSync(`${testingWorkspace.root}/libs/c/CHANGELOG.md`)).toBe(
          false,
        );
      });
    });
  });
});

function getLastTag(dir: string) {
  return execSync('git describe --tags --abbrev=0', {
    encoding: 'utf-8',
    cwd: dir,
  }).trim();
}

function getLastCommitDescription(dir: string) {
  return execSync('git log -1 --pretty=%B', {
    encoding: 'utf-8',
    cwd: dir,
  }).trim();
}

function getTags(dir: string) {
  return execSync('git tag', {
    encoding: 'utf-8',
    cwd: dir,
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
