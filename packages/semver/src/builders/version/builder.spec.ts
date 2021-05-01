import { BuilderContext } from '@angular-devkit/architect';
import { of } from 'rxjs';
import * as standardVersion from 'standard-version';
import * as changelog from 'standard-version/lib/lifecycles/changelog';
import { runBuilder } from './builder';
import { SemverOptions } from './schema';
import { execFile } from 'child_process';

import { callbackify } from 'util';

import { createFakeContext } from './testing';
import { tryBump } from './utils/try-bump';
import * as git from './utils/git';
import * as workspace from './utils/workspace';
import { getPackageFiles } from './utils/workspace';

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
  const mockAddToStage = git.addToStage as jest.MockedFunction<
    typeof git.addToStage
  >;
  const mockTryBump = tryBump as jest.MockedFunction<typeof tryBump>;
  const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
  const mockStandardVersion = standardVersion as jest.MockedFunction<
    typeof standardVersion
  >;

  let context: BuilderContext;

  const options: SemverOptions = {
    dryRun: false,
    noVerify: false,
    push: false,
    remote: 'origin',
    baseBranch: 'main',
    skipRootChangelog: false,
    skipProjectChangelog: false,
    configs: [
      {
        name: 'rx-state',
        path: 'packages/rx-state',
        type: 'independent',
      },
      {
        name: 'cdk',
        type: 'sync-group',
        path: 'packages/cdk',
        packages: ['packages/cdk/operators', 'packages/cdk/helpers'],
      },
    ],
  };

  beforeEach(() => {
    context = createFakeContext({ workspaceRoot: '/root' });

    mockChangelog.mockResolvedValue(undefined);
    mockTryBump.mockReturnValue(of('2.1.0'));

    /* Mock Git execution */
    jest.spyOn(git, 'tryPushToGitRemote').mockReturnValue(of(undefined));
    jest.spyOn(git, 'addToStage').mockReturnValue(of(undefined));

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
        of([
          '/root/packages/rx-state/package.json',
          '/root/packages/cdk/helpers/package.json',
          '/root/packages/cdk/operators/package.json',
        ])
      );
  });

  afterEach(() => {
    (console.info as jest.Mock).mockRestore();
    (getPackageFiles as jest.Mock).mockRestore();
    mockTryPushToGitRemote.mockRestore();
    mockAddToStage.mockRestore();
    mockExecFile.mockRestore();
    mockChangelog.mockRestore();
    mockStandardVersion.mockRestore();
    mockTryBump.mockRestore();
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
          tagPrefix: 'v-',
          path: '/root/packages/rx-state',
          infile: '/root/packages/rx-state/CHANGELOG.md',
          bumpFiles: ['/root/packages/rx-state/package.json'],
          packageFiles: ['/root/packages/rx-state/package.json'],
        })
      );
    });

    it('should not version if no commits since last release', async () => {
      mockTryBump.mockReturnValue(of(null));

      const { success } = await runBuilder(options, context).toPromise();

      expect(success).toBe(true);
      expect(context.logger.info).toBeCalledWith(
        '⏹ Nothing changed since last release.'
      );
      expect(standardVersion).not.toBeCalled();
    });
  });

  describe('sync-group', () => {
    it('should run standard-version on multiple projects', async () => {
      const { success } = await runBuilder(options, context).toPromise();

      expect(success).toBe(true);
      expect(changelog).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          header: expect.any(String),
          dryRun: false,
          infile: '/root/packages/cdk/operators/CHANGELOG.md',
        }),
        '2.1.0'
      );
      expect(changelog).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          header: expect.any(String),
          dryRun: false,
          infile: '/root/packages/cdk/helpers/CHANGELOG.md',
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
            '/root/packages/cdk/operators/package.json',
            '/root/packages/cdk/helpers/package.json',
          ],
          packageFiles: ['/root/package.json'],
          skip: {
            changelog: false,
          },
        })
      );
    });

    it('should skip root CHANGELOG generation (--skip-root-changelog=true)', async () => {
      await runBuilder(
        {
          ...options,
          /* Disable root CHANGELOG */
          skipRootChangelog: true,
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

    it('should skip project CHANGELOG generation (--skip-project-changelog=true)', async () => {
      await runBuilder(
        {
          ...options,
          /* Disable project CHANGELOG */
          skipProjectChangelog: true,
        },
        context
      ).toPromise();

      expect(mockChangelog).not.toBeCalled();
      expect(mockAddToStage).toBeCalledWith(
        expect.objectContaining({ paths: [] })
      );
    });

    it('should not version if no commits since last release', async () => {
      mockTryBump.mockReturnValue(of(null));

      const { success } = await runBuilder(options, context).toPromise();

      expect(success).toBe(true);

      expect(context.logger.info).toBeCalledWith(
        '⏹ Nothing changed since last release.'
      );
      expect(standardVersion).not.toBeCalled();
    });

    it('should add files to Git stage only once', async () => {
      await runBuilder(options, context).toPromise();

      expect(mockAddToStage).toBeCalledTimes(1);
      expect(mockAddToStage).toBeCalledWith({
        paths: expect.arrayContaining([
          '/root/packages/cdk/operators/CHANGELOG.md',
          '/root/packages/cdk/helpers/CHANGELOG.md',
        ]),
        dryRun: false,
      });
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
});
