import * as childProcess from '@lerna/child-process';
import { MockBuilderContext } from '@nrwl/workspace/testing';
import { of } from 'rxjs';
import * as standardVersion from 'standard-version';
import { runBuilder } from './builder';
import { VersionBuilderSchema } from './schema';
import { getMockContext } from './testing';
import * as utils from './utils';
import { getPackageFiles, hasChangelog } from './utils';

jest.mock('@lerna/child-process');
jest.mock('standard-version', () => jest.fn());

describe('@jscutlery/semver:version', () => {
  let context: MockBuilderContext;

  const options: VersionBuilderSchema = {
    dryRun: false,
    noVerify: false,
    push: false,
    remote: 'origin',
    baseBranch: 'main',
    syncVersions: false,
  };

  beforeEach(async () => {
    context = await getMockContext();
    context.logger.error = jest.fn();
    context.target.project = 'a';
    context.getProjectMetadata = jest
      .fn()
      .mockResolvedValue({ root: '/root/packages/a' });

    /* Mock standardVersion. */
    (standardVersion as jest.MockedFunction<
      typeof standardVersion
    >).mockResolvedValue(undefined);

    jest.spyOn(utils, 'hasChangelog').mockReturnValue(true);

    /* Mock readFileSync. */
    jest
      .spyOn(utils, 'getPackageFiles')
      .mockReturnValue(
        of(['/root/packages/a/package.json', '/root/packages/b/package.json'])
      );
  });

  afterEach(() => {
    (standardVersion as jest.Mock).mockRestore();
    (hasChangelog as jest.Mock).mockRestore();
    (getPackageFiles as jest.Mock).mockRestore();
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

  it('should call getPackageFiles with the right root project path', async () => {
    await runBuilder(options, context).toPromise();

    expect(hasChangelog).toBeCalledTimes(1);
    expect(hasChangelog).toBeCalledWith('/root/packages/a');
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

  it('should detect first release', async () => {
    /* Mock the absence of CHANGELOG file */
    jest.spyOn(utils, 'hasChangelog').mockReturnValue(false);

    await runBuilder(options, context).toPromise();

    expect(standardVersion).toBeCalledTimes(1);
    expect(standardVersion).toBeCalledWith(
      expect.objectContaining({ firstRelease: true })
    );
  });

  describe('Independent version', () => {
    it('should run standard-version independently on a project', async () => {
      const output = await runBuilder(options, context).toPromise();

      expect(output).toEqual(expect.objectContaining({ success: true }));
      expect(standardVersion).toBeCalledWith(
        expect.objectContaining({
          silent: false,
          preset: expect.stringContaining('conventional-changelog-angular'),
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

      expect(standardVersion).toBeCalledWith(
        expect.objectContaining({
          silent: false,
          preset: expect.stringContaining('conventional-changelog-angular'),
          dryRun: false,
          noVerify: false,
          tagPrefix: null,
          path: '/root',
          infile: '/root/CHANGELOG.md',
          bumpFiles: [
            '/root/packages/a/package.json',
            '/root/packages/b/package.json',
          ],
          packageFiles: ['/root/package.json'],
        })
      );
      expect(output).toEqual(expect.objectContaining({ success: true }));
    });
  });
});
