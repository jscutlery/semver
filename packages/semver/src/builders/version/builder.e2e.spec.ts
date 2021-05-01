// import { BuilderOutput } from '@angular-devkit/architect';
// import { fileExists } from '@nrwl/nx-plugin/testing';
// import { execSync } from 'child_process';
// import { readFileSync } from 'fs';

// import { runBuilder } from './builder';
// import { SemverOptions } from './schema';
// import { createFakeContext, setupTestingWorkspace, TestingWorkspace } from './testing';
// import { readPackageJson } from './utils/project';

// describe('@jscutlery/semver:version', () => {
//   const defaultBuilderOptions: SemverOptions = {
//     dryRun: false,
//     noVerify: false,
//     push: false,
//     remote: 'origin',
//     baseBranch: 'main',
//     skipRootChangelog: false,
//     skipProjectChangelog: false,
//     configs: [
//       {
//         name: 'rx-state',
//         path: 'packages/rx-state',
//         type: 'independent',
//       },
//       {
//         name: 'cdk',
//         type: 'sync-group',
//         path: 'packages/cdk',
//         packages: ['packages/cdk/operators', 'packages/cdk/helpers'],
//       },
//     ],
//   };

//   const commonWorkspaceFiles: [string, string][] = [
//     ['package.json', JSON.stringify({ version: '0.0.0' })],
//     [
//       'workspace.json',
//       JSON.stringify({
//         projects: {
//           workspace: {
//             root: '.',
//           },
//           'rx-state': {
//             root: 'packages/rx-state',
//           },
//           operators: {
//             root: 'packages/cdk/operators',
//           },
//           helpers: {
//             root: 'packages/cdk/helpers',
//           },
//         },
//       }),
//     ],
//     ['packages/a/.gitkeep', ''],
//     /* "a" has a package.json */
//     ['packages/a/package.json', JSON.stringify({ version: '0.0.0' })],
//     /* but "b" doesn't. */
//     ['packages/b/.gitkeep', ''],
//   ];

//   let result: BuilderOutput;
//   let testingWorkspace: TestingWorkspace;

//   beforeAll(() => jest.spyOn(console, 'info').mockImplementation());
//   afterAll(() => (console.info as jest.Mock).mockRestore());

//   describe('"rx-state" independent package', () => {
//     beforeAll(async () => {
//       testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

//       /* Commit changes. */
//       commitChanges();

//       /* Run builder. */
//       result = await runBuilder(
//         defaultBuilderOptions,
//         createFakeContext({
//           workspaceRoot: testingWorkspace.root,
//         })
//       ).toPromise();
//     });

//     afterAll(() => testingWorkspace.tearDown());

//     it('should return success', () => {
//       expect(result).toEqual({ success: true });
//     });

//     it('should commit all changes', () => {
//       expect(uncommitedChanges()).toHaveLength(0);
//     });

//     it('should not bump root package.json', async () => {
//       expect((await readPackageJson('.').toPromise()).version).toEqual('0.0.0');
//     });

//     it(`should bump a's package.json`, async () => {
//       expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
//         '0.1.0'
//       );
//     });

//     it('should not generate root changelog', () => {
//       expect(fileExists('CHANGELOG.md')).toBe(false);
//     });

//     it(`should generate "rx-state"'s changelog`, async () => {
//       expect(readFileSync('packages/rx-state/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// # 0.1.0 \\(.*\\)


// ### Features

// \\* \\*\\*a:\\*\\* 🚀 new feature .*
// $`)
//       );
//     });
//   });

//   describe('"cdk" sync-group', () => {
//     beforeAll(async () => {
//       testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

//       /* Commit changes. */
//       commitChanges();

//       /* Run builder. */
//       result = await runBuilder(
//         defaultBuilderOptions,
//         createFakeContext({ workspaceRoot: testingWorkspace.root })
//       ).toPromise();
//     });

//     afterAll(() => testingWorkspace.tearDown());

//     it('should return success', () => {
//       expect(result).toEqual({ success: true });
//     });

//     it('should commit all changes', () => {
//       expect(uncommitedChanges()).toHaveLength(0);
//     });

//     it('should not bump root package.json', async () => {
//       expect((await readPackageJson('.').toPromise()).version).toEqual('0.0.0');
//     });

//     it(`should generate "helpers" changelog`, async () => {
//       expect(
//         readFileSync('packages/cdk/helpers/CHANGELOG.md', 'utf-8')
//       ).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// ## 0.0.1 \\(.*\\)


// ### Bug Fixes

// \\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
// $`)
//       );
//     });
//   });

//   it(`should generate "operators" changelog`, async () => {
//     expect(
//       readFileSync('packages/cdk/operators/CHANGELOG.md', 'utf-8')
//     ).toMatch(
//       new RegExp(`^# Changelog

// This file was generated.*

// ## 0.0.1 \\(.*\\)


// ### Bug Fixes

// \\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
// $`)
//     );
//   });

//   describe('"cdk" sync-group with (--skip-root-changelog=true)', () => {
//     beforeAll(async () => {
//       testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

//       /* Commit changes. */
//       commitChanges();

//       /* Run builder. */
//       result = await runBuilder(
//         {
//           ...defaultBuilderOptions,
//           skipRootChangelog: true,
//         },
//         createFakeContext({ workspaceRoot: testingWorkspace.root })
//       ).toPromise();
//     });

//     afterAll(() => testingWorkspace.tearDown());

//     it('should return success', () => {
//       expect(result).toEqual({ success: true });
//     });

//     it('should commit all changes', () => {
//       expect(uncommitedChanges()).toHaveLength(0);
//     });

//     it('should bump root package.json', async () => {
//       expect((await readPackageJson('.').toPromise()).version).toEqual('0.1.0');
//     });

//     it(`should bump "helpers"'s package.json`, async () => {
//       expect((await readPackageJson('packages/cdk/helpers').toPromise()).version).toEqual(
//         '0.1.0'
//       );
//     });

//     it(`should bump "operators"'s package.json`, async () => {
//       expect((await readPackageJson('packages/cdk/operators').toPromise()).version).toEqual(
//         '0.1.0'
//       );
//     });

//     it('should skip root changelog', async () => {
//       expect(fileExists('packages/cdk/CHANGELOG.md')).toBe(false);
//     });

//     it('should generate sub-changelogs', async () => {
//       expect(readFileSync('packages/cdk/helpers/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// # 0.1.0 \\(.*\\)


// ### Features

// \\* \\*\\*a:\\*\\* 🚀 new feature .*
// $`)
//       );

//       expect(readFileSync('packages/cdk/operators/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// # 0.1.0 \\(.*\\)


// ### Bug Fixes

// \\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
// $`)
//       );
//     });
//   });

//   describe('on workspace with --sync-versions=true (--root-changelog=true), after changing lib "b"', () => {
//     beforeAll(async () => {
//       testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

//       /* Commit changes. */
//       commitChanges();

//       /* Run builder. */
//       await runBuilder(
//         {
//           ...defaultBuilderOptions,
//           configs: [
//             {
//               name: 'cdk',
//               type: 'sync-group',
//               path: 'packages/cdk',
//               packages: ['packages/cdk/operators', 'packages/cdk/helpers'],
//             },
//           ],
//         },
//         createFakeContext({
//           project: 'workspace',
//           projectRoot: testingWorkspace.root,
//           workspaceRoot: testingWorkspace.root,
//         })
//       ).toPromise();

//       /* Change b and commit. */
//       execSync(`
//         echo b > packages/b/b
//         git add packages/b/b
//         git commit -m "feat(b): b"
//       `);

//       result = await runBuilder(
//         {
//           ...defaultBuilderOptions,
//           configs: [
//             {
//               name: 'cdk',
//               type: 'sync-group',
//               path: 'packages/cdk',
//               packages: ['packages/cdk/operators', 'packages/cdk/helpers'],
//             },
//           ],
//         },
//         createFakeContext({
//           project: 'workspace',
//           projectRoot: testingWorkspace.root,
//           workspaceRoot: testingWorkspace.root,
//         })
//       ).toPromise();
//     });

//     afterAll(() => testingWorkspace.tearDown());

//     it('should return success', () => {
//       expect(result).toEqual({ success: true });
//     });

//     it('should commit all changes', () => {
//       expect(uncommitedChanges()).toHaveLength(0);
//     });

//     it('should bump root package.json', async () => {
//       expect((await readPackageJson('.').toPromise()).version).toEqual('0.2.0');
//     });

//     /* In sync mode, we bump "a" even if change concerns "b". */
//     it(`should bump "a"'s package.json`, async () => {
//       expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
//         '0.2.0'
//       );
//     });

//     it('should update root changelog', async () => {
//       expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`
// # \\[0.2.0\\]\\(/compare/v0.1.0...v0.2.0\\) \\(.*\\)


// ### Features

// \\* \\*\\*b:\\*\\* b .*



// # 0.1.0 \\(.*\\)
// `)
//       );
//     });

//     it(`should update "a"'s changelog without listing "b"'s feature`, async () => {
//       expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`
// # \\[0.2.0\\]\\(/compare/v0.1.0...v0.2.0\\) \\(.*\\)



// # 0.1.0 \\(.*\\)
// `)
//       );
//     });

//     it(`should update "b"'s changelog with new feature`, async () => {
//       expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`
// # \\[0.2.0\\]\\(/compare/v0.1.0...v0.2.0\\) \\(.*\\)


// ### Features

// \\* \\*\\*b:\\*\\* b .*



// # 0.1.0 \\(.*\\)
// `)
//       );
//     });
//   });

//   describe('workspace with --sync-versions=true --root-changelog=false`', () => {
//     beforeAll(async () => {
//       testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

//       /* Commit changes. */
//       commitChanges();

//       /* Run builder. */
//       result = await runBuilder(
//         {
//           ...defaultBuilderOptions,
//           skipRootChangelog: true,
//           configs: [
//             {
//               name: 'cdk',
//               type: 'sync-group',
//               path: 'packages/cdk',
//               packages: ['packages/cdk/operators', 'packages/cdk/helpers'],
//             },
//           ],
//         },
//         createFakeContext({
//           project: 'workspace',
//           projectRoot: testingWorkspace.root,
//           workspaceRoot: testingWorkspace.root,
//         })
//       ).toPromise();
//     });

//     afterAll(() => testingWorkspace.tearDown());

//     it('should return success', () => {
//       expect(result).toEqual({ success: true });
//     });

//     it('should commit all changes', () => {
//       expect(uncommitedChanges()).toHaveLength(0);
//     });

//     it('should bump root package.json', async () => {
//       expect((await readPackageJson('.').toPromise()).version).toEqual('0.1.0');
//     });

//     it(`should bump "a"'s package.json`, async () => {
//       expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
//         '0.1.0'
//       );
//     });

//     it('should not generate root changelog', () => {
//       expect(fileExists('CHANGELOG.md')).toBe(false);
//     });

//     it('should generate sub-changelogs', async () => {
//       expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// # 0.1.0 \\(.*\\)


// ### Features

// \\* \\*\\*a:\\*\\* 🚀 new feature .*
// $`)
//       );

//       expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// # 0.1.0 \\(.*\\)


// ### Bug Fixes

// \\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
// $`)
//       );
//     });
//   });

//   describe('workspace with --version=major', () => {
//     beforeAll(async () => {
//       testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

//       /* Commit changes. */
//       commitChanges();

//       /* Run builder. */
//       result = await runBuilder(
//         {
//           ...defaultBuilderOptions,
//           configs: [
//             {
//               name: 'cdk',
//               type: 'sync-group',
//               path: 'packages/cdk',
//               packages: ['packages/cdk/operators', 'packages/cdk/helpers'],
//             },
//           ],
//           version: 'major',
//         },
//         createFakeContext({
//           project: 'workspace',
//           projectRoot: testingWorkspace.root,
//           workspaceRoot: testingWorkspace.root,
//         })
//       ).toPromise();
//     });

//     afterAll(() => testingWorkspace.tearDown());

//     it('should return success', () => {
//       expect(result).toEqual({ success: true });
//     });

//     it('should commit all changes', () => {
//       expect(uncommitedChanges()).toHaveLength(0);
//     });

//     it('should bump root package.json', async () => {
//       expect((await readPackageJson('.').toPromise()).version).toEqual('1.0.0');
//     });

//     it(`should bump "a"'s package.json`, async () => {
//       expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
//         '1.0.0'
//       );
//     });

//     it('should generate root changelog', async () => {
//       expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// # 1.0.0 \\(.*\\)


// ### Bug Fixes

// \\* \\*\\*b:\\*\\* 🐞 fix emptiness .*


// ### Features

// \\* \\*\\*a:\\*\\* 🚀 new feature .*
// $`)
//       );
//     });

//     it('should generate sub-changelogs', async () => {
//       expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// # 1.0.0 \\(.*\\)


// ### Features

// \\* \\*\\*a:\\*\\* 🚀 new feature .*
// $`)
//       );

//       expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// # 1.0.0 \\(.*\\)


// ### Bug Fixes

// \\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
// $`)
//       );
//     });
//   });

//   describe('workspace with --version=prerelease --preid=beta', () => {
//     beforeAll(async () => {
//       testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

//       /* Commit changes. */
//       commitChanges();

//       /* Run builder. */
//       result = await runBuilder(
//         {
//           ...defaultBuilderOptions,
//           configs: [
//             {
//               name: 'cdk',
//               type: 'sync-group',
//               path: 'packages/cdk',
//               packages: ['packages/cdk/operators', 'packages/cdk/helpers'],
//             },
//           ],
//           version: 'prerelease',
//           preid: 'beta',
//         },
//         createFakeContext({
//           project: 'workspace',
//           projectRoot: testingWorkspace.root,
//           workspaceRoot: testingWorkspace.root,
//         })
//       ).toPromise();
//     });

//     afterAll(() => testingWorkspace.tearDown());

//     it('should return success', () => {
//       expect(result).toEqual({ success: true });
//     });

//     it('should commit all changes', () => {
//       expect(uncommitedChanges()).toHaveLength(0);
//     });

//     it('should bump root package.json', async () => {
//       expect((await readPackageJson('.').toPromise()).version).toEqual(
//         '0.0.1-beta.0'
//       );
//     });

//     it(`should bump "a"'s package.json`, async () => {
//       expect((await readPackageJson('packages/a').toPromise()).version).toEqual(
//         '0.0.1-beta.0'
//       );
//     });

//     it('should generate root changelog', async () => {
//       expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// ## 0.0.1-beta.0 \\(.*\\)


// ### Bug Fixes

// \\* \\*\\*b:\\*\\* 🐞 fix emptiness .*


// ### Features

// \\* \\*\\*a:\\*\\* 🚀 new feature .*
// $`)
//       );
//     });

//     it('should generate sub-changelogs', async () => {
//       expect(readFileSync('packages/a/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// ## 0.0.1-beta.0 \\(.*\\)


// ### Features

// \\* \\*\\*a:\\*\\* 🚀 new feature .*
// $`)
//       );

//       expect(readFileSync('packages/b/CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Changelog

// This file was generated.*

// ## 0.0.1-beta.0 \\(.*\\)


// ### Bug Fixes

// \\* \\*\\*b:\\*\\* 🐞 fix emptiness .*
// $`)
//       );
//     });
//   });

//   describe('--changelog-header', () => {
//     beforeAll(async () => {
//       testingWorkspace = setupTestingWorkspace(new Map(commonWorkspaceFiles));

//       /* Commit changes. */
//       commitChanges();

//       /* Run builder. */
//       result = await runBuilder(
//         {
//           ...defaultBuilderOptions,
//           changelogHeader: '# Custom changelog header \n',
//         },
//         createFakeContext({
//           project: 'workspace',
//           projectRoot: testingWorkspace.root,
//           workspaceRoot: testingWorkspace.root,
//         })
//       ).toPromise();
//     });

//     afterAll(() => testingWorkspace.tearDown());

//     it('should generate changelogs with custom header', () => {
//       expect(readFileSync('CHANGELOG.md', 'utf-8')).toMatch(
//         new RegExp(`^# Custom changelog header *`)
//       );
//     });
//   });
// });

// function commitChanges() {
//   execSync(
//     `
//         git init

//         # These are needed by CI.
//         git config user.email "bot@jest.io"
//         git config user.name "Test Bot"
//         git config commit.gpgsign false

//         git add .
//         git commit -m "🐣"
//         echo a > packages/a/a.txt
//         git add .
//         git commit -m "feat(a): 🚀 new feature"
//         echo b > packages/b/b.txt
//         git add .
//         git commit -m "fix(b): 🐞 fix emptiness"
//       `
//   );
// }

// function uncommitedChanges() {
//   return (
//     execSync('git status --porcelain', { encoding: 'utf-8' })
//       .split('\n')
//       /* Remove empty line. */
//       .filter((line) => line.length !== 0)
//   );
// }
