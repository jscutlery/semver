import { BuilderContext } from '@angular-devkit/architect';
import { of } from 'rxjs';
import * as standardVersion from 'standard-version';
import * as changelog from 'standard-version/lib/lifecycles/changelog';
import { runBuilder } from './builder';
import { VersionBuilderSchema } from './schema';
import { execFile } from 'child_process';

import { callbackify } from 'util';

import { createFakeContext } from './testing';
import { tryBump } from './utils/try-bump';
import * as git from './utils/git';
import * as workspace from './utils/workspace';
import { getPackageFiles, getProjectRoots } from './utils/workspace';

/* eslint-disable @typescript-eslint/no-var-requires */
const {
  publish: mockPublishA,
  validate: mockValidateA,
} = require('@mock-plugin/A');
const {
  publish: mockPublishB,
  validate: mockValidateB,
} = require('@mock-plugin/B');
/* eslint-enable @typescript-eslint/no-var-requires */

jest.mock(
  '@mock-plugin/A',
  () => ({
    type: '@jscutlery/semver-plugin',
    publish: jest.fn(),
    validate: jest.fn(),
  }),
  {
    virtual: true,
  }
);

jest.mock(
  '@mock-plugin/B',
  () => ({
    type: '@jscutlery/semver-plugin',
    publish: jest.fn(),
    validate: jest.fn(),
  }),
  {
    virtual: true,
  }
);

jest.mock('child_process');
jest.mock('standard-version', () => jest.fn());
jest.mock('standard-version/lib/lifecycles/changelog', () => jest.fn());

jest.mock('./utils/git');
jest.mock('./utils/try-bump');

describe('@jscutlery/semver:version', () => {
  const mockChangelog = changelog as jest.Mock;
  const mockTryPushToGitRemote = git.tryPushToGitRemote as jest.MockedFunction<
    typeof git.tryPushToGitRemote
  >;
  const mockGitAdd = git.gitAdd as jest.MockedFunction<
    typeof git.gitAdd
  >;
  const mockTryBump = tryBump as jest.MockedFunction<typeof tryBump>;
  const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
  const mockStandardVersion = standardVersion as jest.MockedFunction<
    typeof standardVersion
  >;

  let context: BuilderContext;

  const options: VersionBuilderSchema = {
    dryRun: false,
    noVerify: false,
    push: false,
    remote: 'origin',
    baseBranch: 'main',
    syncVersions: false,
    rootChangelog: true,
    plugins: [],
  };

  beforeEach(() => {
    context = createFakeContext({
      project: 'a',
      projectRoot: '/root/packages/a',
      workspaceRoot: '/root',
    });

    mockChangelog.mockResolvedValue(undefined);
    mockTryBump.mockReturnValue(of('2.1.0'));

    /* Mock Git execution */
    jest.spyOn(git, 'tryPushToGitRemote').mockReturnValue(of(undefined));
    jest.spyOn(git, 'gitAdd').mockReturnValue(of(undefined));

    /* Mock a dependency, don't ask me which one. */
    mockExecFile.mockImplementation(
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      callbackify(jest.fn().mockResolvedValue('')) as any
    );

    /* Mock standardVersion. */
    mockStandardVersion.mockResolvedValue(undefined);

    /* Mock console.info. */
    jest.spyOn(console, 'info').mockImplementation();

    /* Mock getPackageFiles. */
    jest
      .spyOn(workspace, 'getPackageFiles')
      .mockReturnValue(
        of(['/root/packages/a/package.json', '/root/packages/b/package.json'])
      );

    /* Mock getProjectRoots. */
    jest
      .spyOn(workspace, 'getProjectRoots')
      .mockReturnValue(of(['/root/packages/a', '/root/packages/b']));
  });

  afterEach(() => {
    (console.info as jest.Mock).mockRestore();
    (getPackageFiles as jest.Mock).mockRestore();
    (getProjectRoots as jest.Mock).mockRestore();
    mockTryPushToGitRemote.mockRestore();
    mockGitAdd.mockRestore();
    mockExecFile.mockRestore();
    mockChangelog.mockRestore();
    mockStandardVersion.mockRestore();
    mockTryBump.mockRestore();
    mockPublishA.mockRestore();
    mockValidateA.mockRestore();
    mockValidateB.mockRestore();
    mockPublishB.mockRestore();
  });

  describe('Independent version', () => {
    it('should run standard-version independently on a project', async () => {
      const { success } = await runBuilder(options, context).toPromise();

      expect(success).toBe(true);
      expect(standardVersion).toBeCalledWith(
        expect.objectContaining({
          silent: false,
          preset: 'angular',
          dryRun: false,
          noVerify: false,
          tagPrefix: 'a-',
          path: '/root/packages/a',
          infile: '/root/packages/a/CHANGELOG.md',
          bumpFiles: ['/root/packages/a/package.json'],
          packageFiles: ['/root/packages/a/package.json'],
        })
      );
    });

    it('should not version if no commits since last release', async () => {
      mockTryBump.mockReturnValue(of(null));

      const { success } = await runBuilder(options, context).toPromise();

      expect(success).toBe(true);
      expect(console.info).toBeCalledWith(
        '⏹ nothing changed since last release'
      );
      expect(standardVersion).not.toBeCalled();
    });
  });

  describe('Sync versions', () => {
    beforeEach(() => {
      /* With the sync versions, the builder runs on the workspace. */
      context = createFakeContext({
        project: 'workspace',
        projectRoot: '/root',
        workspaceRoot: '/root',
      });
    });

    it('should run standard-version on multiple projects', async () => {
      const { success } = await runBuilder(
        {
          ...options,
          /* Enable sync versions. */
          syncVersions: true,
        },
        context
      ).toPromise();

      expect(success).toBe(true);
      expect(changelog).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          header: expect.any(String),
          dryRun: false,
          infile: '/root/packages/a/CHANGELOG.md',
        }),
        '2.1.0'
      );
      expect(changelog).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          header: expect.any(String),
          dryRun: false,
          infile: '/root/packages/b/CHANGELOG.md',
        }),
        '2.1.0'
      );

      expect(standardVersion).toBeCalledWith(
        expect.objectContaining({
          silent: false,
          preset: 'angular',
          dryRun: false,
          noVerify: false,
          path: '/root',
          infile: '/root/CHANGELOG.md',
          bumpFiles: [
            '/root/packages/a/package.json',
            '/root/packages/b/package.json',
          ],
          packageFiles: ['/root/package.json'],
          skip: {
            changelog: false,
          },
        })
      );
    });

    it('should generate root CHANGELOG only when requested', async () => {
      await runBuilder(
        {
          ...options,
          syncVersions: true,
          /* Disable root CHANGELOG */
          rootChangelog: false,
        },
        context
      ).toPromise();

      expect(standardVersion).toBeCalledWith(
        expect.objectContaining({
          skip: {
            changelog: true,
          },
        })
      );
    });

    it('should not version if no commits since last release', async () => {
      mockTryBump.mockReturnValue(of(null));

      const { success } = await runBuilder(
        {
          ...options,
          syncVersions: true,
        },
        context
      ).toPromise();

      expect(success).toBe(true);

      expect(console.info).toBeCalledWith(
        '⏹ nothing changed since last release'
      );
      expect(standardVersion).not.toBeCalled();
    });

    it('should add files to Git stage only once', async () => {
      await runBuilder(
        {
          ...options,
          syncVersions: true,
        },
        context
      ).toPromise();

      expect(mockGitAdd).toBeCalledTimes(1);
      expect(mockGitAdd).toBeCalledWith(
        expect.arrayContaining([
          '/root/packages/a/CHANGELOG.md',
          '/root/packages/b/CHANGELOG.md',
        ]),
        false
      );
    });
  });

  describe('Git push', () => {
    it('should push to Git', async () => {
      mockTryPushToGitRemote.mockReturnValue(
        of({ stderr: '', stdout: 'success' })
      );

      const { success } = await runBuilder(
        { ...options, push: true },
        context
      ).toPromise();

      expect(success).toBe(true);
      expect(mockTryPushToGitRemote).toHaveBeenCalledWith(
        expect.objectContaining({
          remote: 'origin',
          branch: 'main',
          noVerify: false,
        })
      );
    });

    it('should not push to Git by default', async () => {
      await runBuilder(options, context).toPromise();
      expect(mockTryPushToGitRemote).not.toHaveBeenCalled();
    });

    it('should not push to Git with (--dry-run=true)', async () => {
      await runBuilder({ ...options, dryRun: true }, context).toPromise();
      expect(mockTryPushToGitRemote).not.toHaveBeenCalled();
    });
  });

  describe('Plugins', () => {
    beforeEach(() => {
      mockValidateA.mockResolvedValue(true);
      mockPublishA.mockResolvedValue(undefined);
      mockValidateB.mockResolvedValue(true);
      mockPublishB.mockResolvedValue(undefined);
    });

    it('should publish with (--dry-run=false)', async () => {
      await runBuilder(
        { ...options, dryRun: false, plugins: ['@mock-plugin/A'] },
        context
      ).toPromise();

      expect(mockPublishA).toBeCalled();
    });

    it('should not publish with (--dry-run=true)', async () => {
      await runBuilder(
        { ...options, dryRun: true, plugins: ['@mock-plugin/A'] },
        context
      ).toPromise();

      expect(mockPublishA).not.toBeCalled();
    });

    it('should validate before releasing', async () => {
      await runBuilder(
        { ...options, plugins: ['@mock-plugin/A'] },
        context
      ).toPromise();

      expect(mockValidateA).toHaveBeenCalledBefore(
        standardVersion as jest.Mock
      );
    });

    it('should abort when validation hook failed', async () => {
      mockValidateA.mockRejectedValue(new Error('Validation failure'));

      const { success } = await runBuilder(
        { ...options, plugins: ['@mock-plugin/A', '@mock-plugin/B'] },
        context
      ).toPromise();

      expect(success).toBe(false);
      expect(standardVersion).not.toBeCalled();
      expect(mockPublishA).not.toBeCalled();
      expect(mockPublishB).not.toBeCalled();
      expect(context.logger.error).toBeCalledWith(
        expect.stringContaining('Error: Validation failure')
      );
    });

    it('should release before publishing', async () => {
      await runBuilder(
        { ...options, plugins: ['@mock-plugin/A'] },
        context
      ).toPromise();

      expect(standardVersion).toHaveBeenCalledBefore(mockPublishA);
    });
  });
});
