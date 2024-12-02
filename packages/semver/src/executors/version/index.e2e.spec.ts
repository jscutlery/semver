import { execSync } from 'child_process';
import { setupTestingWorkspace, type TestingWorkspace } from './testing';
import { readFileSync, existsSync } from 'fs';

describe('@jscutlery/semver', () => {
  let testingWorkspace: TestingWorkspace;

  beforeAll(() => {
    testingWorkspace = setupTestingWorkspace();
    // Lib a is publishable.
    testingWorkspace.generateLib('a', '--publishable --importPath=@proj/a');
    testingWorkspace.installSemver('a');

    // Lib b is publishable and use the conventional commits preset.
    testingWorkspace.generateLib('b', '--publishable --importPath=@proj/b');
    testingWorkspace.installSemver('b', '--preset=conventionalcommits');

    // Lib c is not publishable.
    testingWorkspace.generateLib('c');

    // Lib d is publishable and use a custom preset.
    testingWorkspace.generateLib('d', '--publishable --importPath=@proj/d');
    testingWorkspace.installSemver('d', '--preset=conventionalcommits');
    testingWorkspace.exec(
      `
        sed -i 's/"preset": "conventionalcommits"/"preset": { "types": [ { "type": "feat", "section": "✨ Awesome features" } ] }/g' libs/d/project.json
      `,
    );
    testingWorkspace.exec(
      `
          git add .
          git commit -m "chore: 🐣 setup workspace" --no-verify
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

    it('should add custom preset', () => {
      expect(readFile(`${testingWorkspace.root}/libs/b/project.json`)).toMatch(
        /conventionalcommits/,
      );
    });
  });

  describe('@jscutlery/semver:version', () => {
    describe('when libs/a changed (v0.0.0 => v0.1.0)', () => {
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
          deterministicChangelog(
            readFile(`${testingWorkspace.root}/libs/a/CHANGELOG.md`),
          ),
        ).toMatchSnapshot('a-0.1.0');
      });
    });

    describe('when libs/a changed (v0.1.0 => v0.1.1)', () => {
      beforeAll(() => {
        testingWorkspace.exec(
          `
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
        expect(getLastTag(testingWorkspace.root)).toBe('a-0.1.1');
      });

      it('should create the second tag', () => {
        expect(getTags(testingWorkspace.root)).toHaveLength(2);
      });

      it('should commit with description', () => {
        expect(getLastCommitDescription(testingWorkspace.root)).toBe(
          'chore(a): release version 0.1.1',
        );
      });

      it('should bump package version', () => {
        expect(
          readFile(`${testingWorkspace.root}/libs/a/package.json`),
        ).toMatch(/"version": "0.1.1"/);
      });

      it('should generate CHANGELOG.md', () => {
        expect(
          deterministicChangelog(
            readFile(`${testingWorkspace.root}/libs/a/CHANGELOG.md`),
          ),
        ).toMatchSnapshot('a-0.1.1');
      });
    });

    describe('when libs/b changed (v0.0.0 => v0.1.0)', () => {
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
          deterministicChangelog(
            readFile(`${testingWorkspace.root}/libs/b/CHANGELOG.md`),
          ),
        ).toMatchSnapshot('b-0.1.0');
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

    describe('when libs/d changed (v0.0.0 => v0.1.0)', () => {
      beforeAll(() => {
        testingWorkspace.exec(
          `
              echo feat > libs/d/d.txt
              git add .
              git commit -m "feat(d): 🚀 new awesome feature"
            `,
        );
        testingWorkspace.runNx(`run d:version --noVerify`);
      });

      it('should commit all changes', () => {
        expect(uncommitedChanges(testingWorkspace.root)).toHaveLength(0);
      });

      it('should tag with version', () => {
        expect(getLastTag(testingWorkspace.root)).toBe('d-0.1.0');
      });
      it('should commit with description', () => {
        expect(getLastCommitDescription(testingWorkspace.root)).toBe(
          'chore(d): release version 0.1.0',
        );
      });

      it('should bump package version', () => {
        expect(
          readFile(`${testingWorkspace.root}/libs/d/package.json`),
        ).toMatch(/"version": "0.1.0"/);
      });

      it('should generate CHANGELOG.md', () => {
        expect(
          deterministicChangelog(
            readFile(`${testingWorkspace.root}/libs/d/CHANGELOG.md`),
          ),
        ).toMatchSnapshot('d-0.1.0');
      });
    });

    describe('when libs/a changed (v0.1.1 => v1.0.0)', () => {
      beforeAll(() => {
        testingWorkspace.exec(
          `
              echo feat >> libs/a/a.txt
              git add .
              git commit -m "feat(a): 🚀 new feature\n\nBREAKING CHANGE: 🚨 Breaking change description"
            `,
        );
        testingWorkspace.runNx(`run a:version --noVerify`);
      });

      it('should tag with version', () => {
        expect(getLastTag(testingWorkspace.root)).toBe('a-1.0.0');
      });

      it('should bump package version', () => {
        expect(
          readFile(`${testingWorkspace.root}/libs/a/package.json`),
        ).toMatch(/"version": "1.0.0"/);
      });

      it('should generate CHANGELOG.md', () => {
        expect(
          deterministicChangelog(
            readFile(`${testingWorkspace.root}/libs/a/CHANGELOG.md`),
          ),
        ).toMatchSnapshot('a-1.0.0');
      });
    });

    describe('when pre-releasing libs/a with --releaseAs=prerelease --preid=beta (v1.0.0 => v1.1.0-beta.0)', () => {
      beforeAll(() => {
        testingWorkspace.exec(
          `
              echo feat >> libs/a/a.txt
              git add .
              git commit -m "feat(a): 🚀 new feature 1"
            `,
        );
        testingWorkspace.runNx(
          `run a:version --releaseAs=prerelease --preid=beta --noVerify`,
        );
      });

      it('should tag with version', () => {
        expect(getLastTag(testingWorkspace.root)).toBe('a-1.1.0-beta.0');
      });

      it('should bump package version', () => {
        expect(
          readFile(`${testingWorkspace.root}/libs/a/package.json`),
        ).toMatch(/"version": "1.1.0-beta.0"/);
      });

      describe('when pre-releasing libs/a with --releaseAs=prerelease --preid=beta (v1.1.0-beta.0 => v1.1.0-beta.1)', () => {
        beforeAll(() => {
          testingWorkspace.exec(
            `
              echo feat >> libs/a/a.txt
              git add .
              git commit -m "feat(a): 🚀 new feature 2"
            `,
          );
          testingWorkspace.runNx(
            `run a:version --releaseAs=prerelease --preid=beta --noVerify`,
          );
        });

        it('should tag with version', () => {
          expect(getLastTag(testingWorkspace.root)).toBe('a-1.1.0-beta.1');
        });

        it('should bump package version', () => {
          expect(
            readFile(`${testingWorkspace.root}/libs/a/package.json`),
          ).toMatch(/"version": "1.1.0-beta.1"/);
        });

        it('should generate CHANGELOG.md', () => {
          expect(
            deterministicChangelog(
              readFile(`${testingWorkspace.root}/libs/a/CHANGELOG.md`),
            ),
          ).toMatchSnapshot('a-1.1.0-beta.1');
        });
      });
    });

    describe('when pre-releasing libs/a with --releaseAs=preminor --preid=alpha (v1.1.0-beta.1 => v1.1.0-alpha.0)', () => {
      beforeAll(() => {
        testingWorkspace.exec(
          `
              echo feat >> libs/a/a.txt
              git add .
              git commit -m "feat(a): 🚀 new feature 1"
            `,
        );
        testingWorkspace.runNx(
          `run a:version --releaseAs=preminor --preid=alpha --noVerify`,
        );
      });

      it('should tag with version', () => {
        expect(getLastTag(testingWorkspace.root)).toBe('a-1.1.0-alpha.0');
      });

      it('should bump package version', () => {
        expect(
          readFile(`${testingWorkspace.root}/libs/a/package.json`),
        ).toMatch(/"version": "1.1.0-alpha.0"/);
      });

      describe('when pre-releasing libs/a with --releaseAs=preminor --preid=alpha (v1.1.0-alpha.0 => v1.2.0-alpha.0)', () => {
        beforeAll(() => {
          testingWorkspace.exec(
            `
              echo feat >> libs/a/a.txt
              git add .
              git commit -m "feat(a): 🚀 new feature 2"
            `,
          );
          testingWorkspace.runNx(
            `run a:version --releaseAs=preminor --preid=alpha --noVerify`,
          );
        });

        it('should tag with version', () => {
          expect(getLastTag(testingWorkspace.root)).toBe('a-1.2.0-alpha.0');
        });

        it('should bump package version', () => {
          expect(
            readFile(`${testingWorkspace.root}/libs/a/package.json`),
          ).toMatch(/"version": "1.2.0-alpha.0"/);
        });

        it('should generate CHANGELOG.md', () => {
          expect(
            deterministicChangelog(
              readFile(`${testingWorkspace.root}/libs/a/CHANGELOG.md`),
            ),
          ).toMatchSnapshot('a-1.2.0-alpha.0');
        });
      });
    });

    describe('when libs/b changed with --skipCommit (v0.1.0 => v0.2.0)', () => {
      beforeAll(() => {
        testingWorkspace.exec(
          `
              echo feat >> libs/b/b.txt
              git add .
              git commit -m "feat(b): 🚀 new feature"
            `,
        );
        testingWorkspace.runNx(`run b:version --noVerify --skipCommit`);
      });

      it('should keep modifications uncommited', () => {
        expect(uncommitedChanges(testingWorkspace.root)).toEqual([
          'M  libs/b/CHANGELOG.md',
          'M  libs/b/package.json',
        ]);
      });

      it('should tag with version', () => {
        expect(getLastTag(testingWorkspace.root)).toBe('b-0.2.0');
      });

      it('should bump package version', () => {
        expect(
          readFile(`${testingWorkspace.root}/libs/b/package.json`),
        ).toMatch(/"version": "0.2.0"/);
      });

      it('should generate CHANGELOG.md', () => {
        expect(
          deterministicChangelog(
            readFile(`${testingWorkspace.root}/libs/b/CHANGELOG.md`),
          ),
        ).toMatchSnapshot('b-0.2.0');
      });
    });
  });

  describe('@jscutlery/semver:migrate-nx-release', () => {
    beforeAll(() => {
      testingWorkspace.runNx(`g @jscutlery/semver:migrate-nx-release`);
      testingWorkspace.exec(
        `
          git add .
          git commit -m "build: 🛠️ migrate to nx release"
        `,
      );
      testingWorkspace.exec(
        `
          echo feat > libs/b/b.txt
          git add .
          git commit -m "feat(b): 🚀 new feature"
        `,
      );
      testingWorkspace.runNx(`release --skip-publish`);
    });

    it('should commit with description', () => {
      expect(getLastCommitDescription(testingWorkspace.root)).toBe(
        `chore(release): publish

- project: b 0.3.0`,
      );
    });

    it('should tag with version', () => {
      expect(getLastTag(testingWorkspace.root)).toBe('b-0.3.0');
    });

    it('should bump package version', () => {
      expect(
        readFile(`${testingWorkspace.root}/dist/libs/b/package.json`),
      ).toMatch(/"version": "0.3.0"/);
    });

    it('should generate CHANGELOG.md', () => {
      expect(
        deterministicChangelog(
          readFile(`${testingWorkspace.root}/libs/b/CHANGELOG.md`),
        ),
      ).toMatchSnapshot('b-0.3.0');
    });

    it('should version projects independently', () => {
      expect(getTags(testingWorkspace.root)).toEqual(
        expect.arrayContaining(['a-1.2.0-alpha.0', 'b-0.3.0', 'd-0.1.0']),
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

function deterministicChangelog(changelog: string) {
  return changelog
    .replace(/\d{4}-\d{1,2}-\d{1,2}/g, 'yyyy-mm-dd')
    .replace(/([0-9a-f]{7})/g, 'xxxxxxx');
}
