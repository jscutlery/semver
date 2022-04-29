import * as gitRawCommits from 'git-raw-commits';
import { lastValueFrom, of, throwError } from 'rxjs';
import { PassThrough } from 'stream';
import * as cp from '../../common/exec';
import {
  addToStage,
  commit,
  createTag,
  getCommits,
  getFirstCommitRef,
  tryPush
} from './git';

jest.mock('git-raw-commits', () => jest.fn());
jest.mock('../../common/exec');

describe('git', () => {
  jest.spyOn(console, 'log').mockImplementation();

  afterEach(() => (cp.exec as jest.Mock).mockReset());

  describe(getCommits.name, () => {
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
  });

  describe(tryPush.name, () => {
    it('should Git push with right options', async () => {
      jest.spyOn(cp, 'exec').mockReturnValue(of('success'));

      await lastValueFrom(
        tryPush({
          tag: 'v1.0.0',
          remote: 'upstream',
          branch: 'master',
          noVerify: false,
          projectName: 'p',
        })
      );

      expect(cp.exec).toBeCalledWith(
        'git',
        expect.arrayContaining([
          'push',
          '--atomic',
          'upstream',
          'master',
          'v1.0.0'
        ])
      );
    });

    it(`should Git push and add '--no-verify' option when asked for`, async () => {
      jest.spyOn(cp, 'exec').mockReturnValue(of('success'));

      await lastValueFrom(
        tryPush({
          tag: 'v1.0.0',
          remote: 'origin',
          branch: 'main',
          noVerify: true,
          projectName: 'p',
        })
      );

      expect(cp.exec).toBeCalledWith(
        'git',
        expect.arrayContaining([
          'push',
          '--no-verify',
          '--atomic',
          'origin',
          'main',
          'v1.0.0',
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
        tryPush({
          tag: 'v1.0.0',
          remote: 'origin',
          branch: 'master',
          noVerify: false,
          projectName: 'p',
        })
      );

      expect(cp.exec).toHaveBeenNthCalledWith(
        1,
        'git',
        expect.arrayContaining(['push', '--atomic', 'v1.0.0'])
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
          tryPush({
            tag: 'v1.0.0',
            remote: 'origin',
            branch: 'master',
            noVerify: false,
            projectName: 'p',
          })
        )
      ).rejects.toEqual(new Error('Something went wrong'));
      expect(cp.exec).toBeCalledTimes(1);
    });

    it('should fail if options are undefined', async () => {
      await expect(
        lastValueFrom(
          tryPush({
            tag: 'v1.0.0',
            /* eslint-disable @typescript-eslint/no-explicit-any */
            remote: undefined as any,
            branch: undefined as any,
            /* eslint-enable @typescript-eslint/no-explicit-any */
            noVerify: false,
            projectName: 'p',
          })
        )
      ).rejects.toEqual(expect.any(Error));
    });
  });

  describe(addToStage.name, () => {
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

  describe(getFirstCommitRef.name, () => {
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

  describe(createTag.name, () => {
    it('should create git tag', async () => {
      jest.spyOn(cp, 'exec').mockReturnValue(of('success'));

      const tag = await lastValueFrom(
        createTag({
          dryRun: false,
          tag: 'project-a-1.0.0',
          commitMessage: 'chore(release): 1.0.0',
          projectName: 'p',
        })
      );

      expect(tag).toBe('project-a-1.0.0');
      expect(cp.exec).toBeCalledWith(
        'git',
        expect.arrayContaining([
          'tag',
          '-a',
          'project-a-1.0.0',
          '-m',
          'chore(release): 1.0.0',
        ])
      );
    });

    it('should skip if --dryRun', (done) => {
      createTag({
        dryRun: true,
        tag: 'project-a-1.0.0',
        commitMessage: 'chore(release): 1.0.0',
        projectName: 'p',
      }).subscribe({
        complete: () => {
          expect(cp.exec).not.toBeCalled();
          done();
        },
      });
    });

    it('should handle tag already exists error', (done) => {
      jest
        .spyOn(cp, 'exec')
        .mockReturnValue(
          throwError(
            () => new Error("fatal: tag 'project-a-1.0.0' already exists")
          )
        );

      createTag({
        dryRun: false,
        tag: 'project-a-1.0.0',
        commitMessage: 'chore(release): 1.0.0',
        projectName: 'p',
      }).subscribe({
        next: expect.fail,
        complete: () => expect.fail('should not complete'),
        error: (error) => {
          expect(cp.exec).toBeCalled();
          expect(error.message).toMatch(
            'Failed to create "project-a-1.0.0", this tag already exists'
          );
          done();
        },
      });
    });
  });

  describe(commit.name, () => {
    beforeEach(() => jest.spyOn(cp, 'exec').mockReturnValue(of('success')));

    it('should commit', async () => {
      await lastValueFrom(
        commit({
          dryRun: false,
          noVerify: false,
          commitMessage: 'chore(release): 1.0.0',
          projectName: 'p',
        })
      );

      expect(cp.exec).toBeCalledWith(
        'git',
        expect.arrayContaining(['commit', '-m', 'chore(release): 1.0.0'])
      );
    });

    it('should pass --dryRun', (done) => {
        commit({
          dryRun: true,
          noVerify: false,
          commitMessage: 'chore(release): 1.0.0',
          projectName: 'p',
        }).subscribe({
          complete: () => {
            expect(cp.exec).not.toBeCalled();
            done();
          },
        });
    });

    it('should pass --noVerify', async () => {
      await lastValueFrom(
        commit({
          dryRun: false,
          noVerify: true,
          commitMessage: 'chore(release): 1.0.0',
          projectName: 'p',
        })
      );

      expect(cp.exec).toBeCalledWith(
        'git',
        expect.arrayContaining(['--no-verify'])
      );
    });
  });
});
