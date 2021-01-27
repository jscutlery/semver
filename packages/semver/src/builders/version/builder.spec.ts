import { BuilderContext } from '@angular-devkit/architect';
import * as childProcess from '@lerna/child-process';
import { of } from 'rxjs';
import * as standardVersion from 'standard-version';
import * as changelog from 'standard-version/lib/lifecycles/changelog';
import { _enableWip, runBuilder } from './builder';
import { VersionBuilderSchema } from './schema';
import { createFakeContext } from './testing';
import * as utils from './utils';
import { getChangelogFiles, getPackageFiles, hasChangelog } from './utils';
import { tryBump } from './utils/try-bump';

jest.mock('@lerna/child-process');
jest.mock('standard-version', () => jest.fn());
jest.mock('standard-version/lib/lifecycles/changelog', () => jest.fn());
jest.mock('./utils/try-bump');

// @todo get rid of this
_enableWip();

describe('@jscutlery/semver:version', () => {
  const mockChangelog = changelog as jest.Mock;
  const mockTryBump = tryBump as jest.MockedFunction<typeof tryBump>;

  let context: BuilderContext;

  const options: VersionBuilderSchema = {
    dryRun: false,
    noVerify: false,
    push: false,
    remote: 'origin',
    baseBranch: 'main',
    syncVersions: false,
    rootChangelog: true,
  };

  beforeEach(async () => {
    context = createFakeContext({
      project: 'a',
      projectRoot: '/root/packages/a',
      workspaceRoot: '/root',
    });

    mockChangelog.mockResolvedValue(undefined);
    mockTryBump.mockReturnValue(of('2.1.0'));

    /* Mock standardVersion. */
    (standardVersion as jest.MockedFunction<
      typeof standardVersion
    >).mockResolvedValue(undefined);

    jest.spyOn(utils, 'hasChangelog').mockReturnValue(true);

    /* Mock getPackageFiles. */
    jest
      .spyOn(utils, 'getPackageFiles')
      .mockReturnValue(
        of(['/root/packages/a/package.json', '/root/packages/b/package.json'])
      );

    /* Mock getChangelogFiles. */
    jest.spyOn(utils, 'getChangelogFiles').mockReturnValue(
      of([
        {
          changelogFile: '/root/packages/a/CHANGELOG.md',
          projectRoot: '/root/packages/a',
        },
        {
          changelogFile: '/root/packages/b/CHANGELOG.md',
          projectRoot: '/root/packages/b',
        },
      ])
    );
  });

  afterEach(() => {
    (standardVersion as jest.Mock).mockRestore();
    (changelog as jest.Mock).mockRestore();
    (hasChangelog as jest.Mock).mockRestore();
    (getPackageFiles as jest.Mock).mockRestore();
    (getChangelogFiles as jest.Mock).mockRestore();
    (tryBump as jest.Mock).mockRestore();
  });

  it('should not push to Git by default', async () => {
    await runBuilder(options, context).toPromise();

    expect(childProcess.exec).not.toHaveBeenCalled();
  });

  it('should call getPackageFiles with the right root project path', async () => {
    await runBuilder(options, context).toPromise();

    expect(getPackageFiles).toBeCalledTimes(1);
    expect(getPackageFiles).toBeCalledWith('/root');
  });

  it('should push to Git with right options', async () => {
    await runBuilder(
      { ...options, push: true, remote: 'origin', baseBranch: 'main' },
      context
    ).toPromise();

    expect(childProcess.exec).toHaveBeenCalledWith(
      'git',
      expect.arrayContaining([
        'push',
        '--follow-tags',
        '--atomic',
        'origin',
        'main',
      ])
    );
  });

  it(`should push to Git and add '--no-verify' option when asked for`, async () => {
    await runBuilder(
      {
        ...options,
        push: true,
        noVerify: true,
      },
      context
    ).toPromise();

    expect(childProcess.exec).toHaveBeenCalledWith(
      'git',
      expect.arrayContaining([
        'push',
        '--follow-tags',
        '--no-verify',
        '--atomic',
        'origin',
        'main',
      ])
    );
  });

  it('should fail if Git config is missing', async () => {
    const output = await runBuilder(
      { ...options, push: true, remote: undefined, baseBranch: undefined },
      context
    ).toPromise();

    expect(context.logger.error).toBeCalledWith(
      expect.stringContaining('Missing configuration')
    );
    expect(output).toEqual(expect.objectContaining({ success: false }));
  });

  describe('Independent version', () => {
    it('should run standard-version independently on a project', async () => {
      const output = await runBuilder(options, context).toPromise();

      expect(output).toEqual(expect.objectContaining({ success: true }));
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
  });

  describe('Sync versions', () => {
    beforeEach(() => {
      /* With the sync versions, the builder runs on the workspace. */
      (context.getProjectMetadata as jest.MockedFunction<
        typeof context.getProjectMetadata
      >).mockResolvedValue({ root: '/root' });
      context.target.project = 'workspace';
    });

    it('should run standard-version on multiple projects', async () => {
      const output = await runBuilder(
        {
          ...options,
          /* Enable sync versions. */
          syncVersions: true,
        },
        context
      ).toPromise();

      expect(output).toEqual(expect.objectContaining({ success: true }));

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
  });
});
