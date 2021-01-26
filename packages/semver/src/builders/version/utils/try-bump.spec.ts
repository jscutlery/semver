import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import { of } from 'rxjs';
import { callbackify } from 'util';
import { getCurrentVersion } from './get-current-version';
import { getCommits } from './git';
import { tryBump } from './try-bump';

jest.mock('conventional-recommended-bump');
jest.mock('./get-current-version');
jest.mock('./git');

describe('tryBump', () => {
  const mockConventionalRecommendedBump = conventionalRecommendedBump as jest.MockedFunction<
    typeof conventionalRecommendedBump
  >;
  const mockCurrentVersion = getCurrentVersion as jest.MockedFunction<
    typeof getCurrentVersion
  >;
  const mockGetCommits = getCommits as jest.MockedFunction<typeof getCommits>;

  beforeEach(() => mockCurrentVersion.mockReturnValue(of('2.1.0')));

  afterEach(() => (getCommits as jest.Mock).mockRestore());

  it('should compute next version based on current version and changes', async () => {
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
      projectRoot: '/libs/demo',
      tagPrefix: 'demo-',
    }).toPromise();

    expect(newVersion).toEqual('2.2.0');

    expect(mockGetCommits).toBeCalledTimes(1);
    expect(mockGetCommits).toBeCalledWith({
      projectRoot: '/libs/demo',
      since: 'demo-2.1.0',
    });

    expect(mockConventionalRecommendedBump).toBeCalledTimes(1);
    expect(mockConventionalRecommendedBump).toBeCalledWith(
      {
        path: '/libs/demo',
        preset: 'angular',
        tagPrefix: 'demo-',
      },
      expect.any(Function)
    );
  });

  it('should call getCommits with "since: null" if version is 0.0.0', async () => {
    mockCurrentVersion.mockReturnValue(of('0.0.0'));
    mockGetCommits.mockReturnValue(of([]));

    await tryBump({
      projectRoot: '/libs/demo',
      tagPrefix: 'demo-',
    }).toPromise();

    expect(mockGetCommits).toBeCalledTimes(1);
    expect(mockGetCommits).toBeCalledWith({
      projectRoot: '/libs/demo',
      since: null,
    });
  });

  it('should return null if there are no changes in current path', async () => {
    mockGetCommits.mockReturnValue(of([]));

    const newVersion = await tryBump({
      projectRoot: '/libs/demo',
      tagPrefix: 'demo-',
    }).toPromise();
    expect(newVersion).toBe(null);

    expect(mockGetCommits).toBeCalledWith({
      projectRoot: '/libs/demo',
      since: 'demo-2.1.0',
    });
  });
});
