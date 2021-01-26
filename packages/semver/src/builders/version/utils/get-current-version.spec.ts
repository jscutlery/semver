import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { readPackageJson } from './project';
import * as projectUtils from './project';

function getCurrentVersion({
  projectRoot,
}: {
  projectRoot: string;
}): Observable<string> {
  return readPackageJson({ projectRoot }).pipe(
    map((packageInfo) => packageInfo.version as string)
  );
}

describe('getCurrentVersion', () => {
  afterEach(() => (readPackageJson as jest.Mock).mockRestore());

  it('should compute current version from package.json', async () => {
    jest.spyOn(projectUtils, 'readPackageJson').mockReturnValue(
      of({
        version: '2.1.0',
      })
    );
    const version = await getCurrentVersion({
      projectRoot: '/root',
    }).toPromise();
    expect(version).toEqual('2.1.0');
    expect(readPackageJson).toBeCalledWith({
      projectRoot: '/root',
    });
  });

  it.todo(
    '🚧 should compute current version from tags if package.json is not present'
  );

  it.todo('🚧 should default to 0.0.0');
});
