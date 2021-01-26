import { Observable, of } from 'rxjs';
import { concatMap, map, switchMap } from 'rxjs/operators';
import * as currentVersion from './get-current-version';
import { getCurrentVersion } from './get-current-version';
import * as git from './git';
import { getCommits } from './git';

function tryBump({
  projectRoot,
  tagPrefix,
}: {
  projectRoot: string;
  tagPrefix: string;
}): Observable<string> {
  return getCurrentVersion({
    projectRoot,
    tagPrefix,
  }).pipe(
    switchMap((version) =>
      getCommits({
        projectRoot,
        since: `${tagPrefix}${version}`,
      })
    ),
    map((commits) => {
      if (commits.length === 0) {
        return null;
      }
      // @todo
      return '2.2.0';
    })
  );
}

describe('tryBump', () => {
  beforeEach(() =>
    jest.spyOn(currentVersion, 'getCurrentVersion').mockReturnValue(of('2.1.0'))
  );

  afterEach(() => (getCommits as jest.Mock).mockRestore());

  it('🚧 should compute next version based on current version and changes', async () => {
    jest.spyOn(git, 'getCommits').mockReturnValue(of(['feat: A', 'feat: B']));

    const newVersion = await tryBump({
      projectRoot: '/libs/demo',
      tagPrefix: 'demo-',
    }).toPromise();

    expect(newVersion).toEqual('2.2.0');
    expect(getCommits).toBeCalledTimes(1);
    expect(getCommits).toBeCalledWith({
      projectRoot: '/libs/demo',
      since: 'demo-2.1.0',
    });
  });

  it('should return null if there are no changes in current path', async () => {
    jest.spyOn(git, 'getCommits').mockReturnValue(of([]));

    const newVersion = await tryBump({
      projectRoot: '/libs/demo',
      tagPrefix: 'demo-',
    }).toPromise();
    expect(newVersion).toBe(null);

    expect(getCommits).toBeCalledWith({
      projectRoot: '/libs/demo',
      since: 'demo-2.1.0',
    });
  });

  it.todo('🚧 should call getCommits with "since: null" if version is 0.0.0');
});
