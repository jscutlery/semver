import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { hasPackageJson, readPackageJson } from './project';
import * as projectUtils from './project';

jest.mock('./project');

function getCurrentVersion(projectRoot: string): Observable<string> {
  if (hasPackageJson(projectRoot)) {
    return readPackageJson(projectRoot).pipe(
      map((packageInfo) => packageInfo.version as string)
    );
  }

  return of('0.0.0');
}

describe('getCurrentVersion', () => {
  afterEach(() => {
    (hasPackageJson as jest.Mock).mockRestore();
    (readPackageJson as jest.Mock).mockRestore();
  });

  it('should compute current version from package.json', async () => {
    jest.spyOn(projectUtils, 'hasPackageJson').mockReturnValue(true);
    jest.spyOn(projectUtils, 'readPackageJson').mockReturnValue(
      of({
        version: '2.1.0',
      })
    );
    const version = await getCurrentVersion('/root').toPromise();
    expect(version).toEqual('2.1.0');
    expect(readPackageJson).toBeCalledWith('/root');
  });

  /* Cf. https://github.com/conventional-changelog/standard-version/blob/master/lib/latest-semver-tag.js */
  it.todo(
    '🚧 should compute current version from tags if package.json is not present'
  );

  it('should default to 0.0.0', async () => {
    jest.spyOn(projectUtils, 'hasPackageJson').mockReturnValue(false);
    const version = await getCurrentVersion('/root').toPromise();
    expect(version).toEqual('0.0.0');
    expect(hasPackageJson).toBeCalledWith('/root');
  });
});
