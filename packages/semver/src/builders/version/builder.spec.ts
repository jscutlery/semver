import * as childProcess from '@lerna/child-process';
import { MockBuilderContext } from '@nrwl/workspace/testing';
import * as fs from 'fs';
import * as standardVersion from 'standard-version';

import { getMockContext } from './testing';
import { runBuilder } from './builder';
import { VersionBuilderSchema } from './schema';

jest.mock('@lerna/child-process');
jest.mock('standard-version', () => jest.fn(() => Promise.resolve()));

const options: VersionBuilderSchema = {
  dryRun: false,
  noVerify: false,
  firstRelease: false,
  push: false,
  remote: 'origin',
  baseBranch: 'main',
  syncVersions: false,
};

describe('@jscutlery/semver:version', () => {
  let context: MockBuilderContext;
  let fakeReadFileSync: jest.Mock;

  beforeEach(async () => {
    context = await getMockContext();
    context.logger.error = jest.fn();
    context.target.project = 'lib';
    context.getProjectMetadata = jest
      .fn()
      .mockResolvedValue({ root: '/root/packages/lib' });

    fakeReadFileSync = jest.fn().mockReturnValue(
      JSON.stringify({
        version: 1,
        projects: {
          a: {
            root: 'packages/a',
          },
          b: {
            root: 'packages/b',
          },
        },
      })
    );
    jest
      .spyOn(fs, 'readFile')
      .mockImplementation((...args: Parameters<typeof fs.readFile>) => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const callback = args[args.length - 1] as Function;
        try {
          callback(null, fakeReadFileSync(args));
        } catch (e) {
          callback(e);
        }
      });
  });

  afterEach(() =>
    (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRestore()
  );

  it('should not push to Git by default', async () => {
    await runBuilder(options, context).toPromise();

    expect(childProcess.exec).not.toHaveBeenCalled();
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
          preset: expect.stringContaining('conventional-changelog-angular'),
          dryRun: false,
          noVerify: false,
          firstRelease: false,
          tagPrefix: 'lib-',
          path: '/root/packages/lib',
          infile: '/root/packages/lib/CHANGELOG.md',
          bumpFiles: ['/root/packages/lib/package.json'],
          packageFiles: ['/root/packages/lib/package.json'],
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

      expect(fs.readFile).toBeCalledTimes(1);
      expect(fs.readFile).toBeCalledWith(
        '/root/workspace.json',
        'utf-8',
        expect.any(Function)
      );
      expect(standardVersion).toBeCalledWith(
        expect.objectContaining({
          silent: false,
          preset: expect.stringContaining('conventional-changelog-angular'),
          dryRun: false,
          noVerify: false,
          firstRelease: false,
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
