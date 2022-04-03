import * as gitRawCommits from 'git-raw-commits';
import { lastValueFrom, of, throwError } from 'rxjs';
import { PassThrough } from 'stream';

import * as cp from '../../common/exec';
import {
  addToStage,
  getCommits,
  getFirstCommitRef,
  tryPushToGitRemote,
} from './git';

jest.mock('git-raw-commits', () => jest.fn());
jest.mock('../../common/exec');

describe('git', () => {
  afterEach(() => (cp.exec as jest.Mock).mockReset());

  describe('getCommits', () => {
    const mockGitRawCommits = gitRawCommits as jest.Mock;

    it('should get commits list', () => {
      const stream = new PassThrough();
      mockGitRawCommits.mockReturnValue(stream);

      const observer = {
        next: jest.fn(),
        complete: jest.fn(),
      };

      getCommits({
        projectRoot: 'libs/demo',
        since: 'x1.0.0',
      }).subscribe(observer);

      stream.emit('data', 'feat A');
      stream.emit('data', 'feat B');
      stream.emit('close');

      expect(observer.next).toBeCalledTimes(1);
      expect(observer.next).toBeCalledWith(['feat A', 'feat B']);
      expect(observer.complete).toBeCalledTimes(1);
    });

    describe('tryPushToGitRemote', () => {
      it('should Git push with right options', async () => {
        jest.spyOn(cp, 'exec').mockReturnValue(of('success'));

        await lastValueFrom(
          tryPushToGitRemote({
            remote: 'upstream',
            branch: 'master',
            noVerify: false,
          })
        );

        expect(cp.exec).toBeCalledWith(
          'git',
          expect.arrayContaining([
            'push',
            '--follow-tags',
            '--atomic',
            'upstream',
            'master',
          ])
        );
      });

      it(`should Git push and add '--no-verify' option when asked for`, async () => {
        jest.spyOn(cp, 'exec').mockReturnValue(of('success'));

        await lastValueFrom(
          tryPushToGitRemote({
            remote: 'origin',
            branch: 'main',
            noVerify: true,
          })
        );

        expect(cp.exec).toBeCalledWith(
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

      it(`should retry Git push if '--atomic' option not supported`, async () => {
        jest
          .spyOn(cp, 'exec')
          .mockReturnValueOnce(throwError(() => new Error('atomic failed')))
          .mockReturnValueOnce(of('success'));

        jest.spyOn(console, 'warn').mockImplementation();

        await lastValueFrom(
          tryPushToGitRemote({
            remote: 'origin',
            branch: 'master',
            noVerify: false,
          })
        );

        expect(cp.exec).toHaveBeenNthCalledWith(
          1,
          'git',
          expect.arrayContaining(['push', '--atomic', '--follow-tags'])
        );
        expect(cp.exec).toHaveBeenNthCalledWith(
          2,
          'git',
          expect.not.arrayContaining(['--atomic'])
        );
        expect(console.warn).toBeCalled();
      });

      it(`should throw if Git push failed`, async () => {
        jest
          .spyOn(cp, 'exec')
          .mockReturnValue(throwError(() => new Error('Something went wrong')));

        await expect(
          lastValueFrom(
            tryPushToGitRemote({
              remote: 'origin',
              branch: 'master',
              noVerify: false,
            })
          )
        ).rejects.toEqual(new Error('Something went wrong'));
        expect(cp.exec).toBeCalledTimes(1);
      });

      it('should fail if options are undefined', async () => {
        await expect(
          lastValueFrom(
            tryPushToGitRemote({
              /* eslint-disable @typescript-eslint/no-explicit-any */
              remote: undefined as any,
              branch: undefined as any,
              /* eslint-enable @typescript-eslint/no-explicit-any */
              noVerify: false,
            })
          )
        ).rejects.toEqual(expect.any(Error));
      });
    });
  });

  describe('addToStage', () => {
    it('should add to git stage', async () => {
      jest.spyOn(cp, 'exec').mockReturnValue(of('ok'));

      await lastValueFrom(
        addToStage({
          paths: ['packages/demo/file.txt', 'packages/demo/other-file.ts'],
          dryRun: false,
        })
      );

      expect(cp.exec).toBeCalledWith(
        'git',
        expect.arrayContaining([
          'add',
          'packages/demo/file.txt',
          'packages/demo/other-file.ts',
        ])
      );
    });

    it('should skip git add if paths argument is empty', async () => {
      jest.spyOn(cp, 'exec').mockReturnValue(of('ok'));

      await lastValueFrom(
        addToStage({
          paths: [],
          dryRun: false,
        }),
        { defaultValue: undefined }
      );

      expect(cp.exec).not.toBeCalled();
    });
  });

  describe('getFirstCommitRef', () => {
    it('should get last git commit', async () => {
      jest.spyOn(cp, 'exec').mockReturnValue(of('sha1\n'));

      const tag = await lastValueFrom(getFirstCommitRef());

      expect(tag).toBe('sha1');
      expect(cp.exec).toBeCalledWith(
        'git',
        expect.arrayContaining(['rev-list', '--max-parents=0', 'HEAD'])
      );
    });
  });
});
