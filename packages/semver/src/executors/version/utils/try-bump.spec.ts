import { logger } from '@nrwl/devkit';
import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import { of, throwError } from 'rxjs';
import { callbackify } from 'util';

import { getLastVersion } from './get-last-version';
import { getCommits, getFirstCommitRef } from './git';
import { tryBump } from './try-bump';

jest.mock('conventional-recommended-bump');
jest.mock('./get-last-version');
jest.mock('./git');

describe('tryBump', () => {
  const mockConventionalRecommendedBump = conventionalRecommendedBump as jest.MockedFunction<
    typeof conventionalRecommendedBump
  >;
  const mockGetLastVersion = getLastVersion as jest.MockedFunction<
    typeof getLastVersion
  >;
  const mockGetCommits = getCommits as jest.MockedFunction<typeof getCommits>;
  const mockGetFirstCommitRef = getFirstCommitRef as jest.MockedFunction<
    typeof getFirstCommitRef
  >;

  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetLastVersion.mockReturnValue(of('2.1.0'));
    loggerSpy = jest.spyOn(logger, 'warn');
  });

  afterEach(() => {
    mockGetLastVersion.mockRestore();
    mockConventionalRecommendedBump.mockRestore();
    mockGetCommits.mockRestore();
    mockGetFirstCommitRef.mockRestore();
    loggerSpy.mockRestore();
  });

  afterEach(() => (getCommits as jest.Mock).mockRestore());

  it('should compute next version based on last version and changes', async () => {
    mockGetCommits.mockReturnValue(of(['feat: A', 'feat: B']));
    /* Mock bump to return "minor". */
    mockConventionalRecommendedBump.mockImplementation(
      callbackify(
        jest.fn().mockResolvedValue({
          releaseType: 'minor',
        })
      )
    );

    const newVersion = await tryBump({
      preset: 'angular',
      projectRoot: '/libs/demo',
      tagPrefix: 'v',
      releaseType: null,
      preid: null,
    }).toPromise();

    expect(newVersion).toEqual('2.2.0');

    expect(mockGetCommits).toBeCalledTimes(1);
    expect(mockGetCommits).toBeCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.1.0',
    });

    expect(mockConventionalRecommendedBump).toBeCalledTimes(1);
    expect(mockConventionalRecommendedBump).toBeCalledWith(
      {
        path: '/libs/demo',
        preset: 'angular',
        tagPrefix: 'v',
      },
      expect.any(Function)
    );
  });

  it('should use given type to calculate next version', async () => {
    mockGetCommits.mockReturnValue(of(['feat: A', 'feat: B']));

    const newVersion = await tryBump({
      preset: 'angular',
      projectRoot: '/libs/demo',
      tagPrefix: 'v',
      releaseType: 'premajor',
      preid: 'alpha',
    }).toPromise();

    expect(newVersion).toEqual('3.0.0-alpha.0');

    expect(mockConventionalRecommendedBump).not.toBeCalled();

    expect(mockGetCommits).toBeCalledTimes(1);
    expect(mockGetCommits).toBeCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.1.0',
    });
  });

  it('should use given type to calculate next version even if there are no changes', async () => {
    mockGetCommits.mockReturnValue(of([]));

    const newVersion = await tryBump({
      preset: 'angular',
      projectRoot: '/libs/demo',
      tagPrefix: 'v',
      releaseType: 'patch',
      preid: null,
    }).toPromise();

    expect(newVersion).toEqual('2.1.1');

    expect(mockConventionalRecommendedBump).not.toBeCalled();
  });

  it('should call getFirstCommitRef if version is 0.0.0', async () => {
    mockGetLastVersion.mockReturnValue(throwError('No version found'));
    mockGetCommits.mockReturnValue(of([]));
    mockGetFirstCommitRef.mockReturnValue(of('sha1'));

    await tryBump({
      preset: 'angular',
      projectRoot: '/libs/demo',
      tagPrefix: 'v',
      releaseType: null,
      preid: null,
    }).toPromise();

    expect(loggerSpy).toBeCalledWith(
      expect.stringContaining('No previous version tag found')
    );
    expect(mockGetCommits).toBeCalledTimes(1);
    expect(mockGetCommits).toBeCalledWith({
      projectRoot: '/libs/demo',
      since: 'sha1',
    });
  });

  it('should return null if there are no changes in current path', async () => {
    mockGetCommits.mockReturnValue(of([]));

    const newVersion = await tryBump({
      preset: 'angular',
      projectRoot: '/libs/demo',
      tagPrefix: 'v',
      releaseType: null,
      preid: null,
    }).toPromise();

    expect(newVersion).toBe(null);

    expect(mockGetCommits).toBeCalledWith({
      projectRoot: '/libs/demo',
      since: 'v2.1.0',
    });
  });
});
