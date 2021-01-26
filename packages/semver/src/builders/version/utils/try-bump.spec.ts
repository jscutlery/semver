import * as conventionalRecommendedBump from 'conventional-recommended-bump';
import { Observable, defer, of, forkJoin } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { callbackify, promisify } from 'util';
import { getCurrentVersion } from './get-current-version';
import { getCommits } from './git';
import * as semver from 'semver';

jest.mock('conventional-recommended-bump');
jest.mock('./get-current-version');
jest.mock('./git');

function tryBump({
  preset = 'angular',
  projectRoot,
  tagPrefix,
}: {
  preset?: string;
  projectRoot: string;
  tagPrefix: string;
}): Observable<string> {
  const version$ = getCurrentVersion({
    projectRoot,
    tagPrefix,
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  );

  const commits$ = version$.pipe(
    switchMap((version) =>
      getCommits({
        projectRoot,
        since: `${tagPrefix}${version}`,
      })
    )
  );

  return forkJoin([version$, commits$]).pipe(
    switchMap(([version, commits]) => {
      /* No commits since last release so don't bump. */
      if (commits.length === 0) {
        return of(null);
      }

      /* Compute new version. */
      return defer(async () => {
        /* Compute release type depending on commits. */
        const { releaseType } = await promisify(conventionalRecommendedBump)({
          path: projectRoot,
          preset,
          tagPrefix,
        });

        /* Compute new version depending on release type. */
        return semver.inc(version, releaseType);
      });
    })
  );
}

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

  it.todo('🚧 should call getCommits with "since: null" if version is 0.0.0');
});
