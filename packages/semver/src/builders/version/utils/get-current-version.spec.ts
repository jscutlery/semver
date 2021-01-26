import * as gitSemverTags from 'git-semver-tags';
import { of } from 'rxjs';
import { callbackify } from 'util';
import { getCurrentVersion } from './get-current-version';
import * as projectUtils from './project';
import { hasPackageJson, readPackageJson } from './project';

jest.mock('git-semver-tags', () => jest.fn());
jest.mock('./project');

describe('getCurrentVersion', () => {
  let mockGitSemverTags: jest.Mock;

  beforeEach(() => {
    mockGitSemverTags = jest.fn();
    (gitSemverTags as jest.Mock).mockImplementation(
      callbackify(mockGitSemverTags)
    );
  });

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
    const version = await getCurrentVersion({
      projectRoot: '/root',
    }).toPromise();

    expect(version).toEqual('2.1.0');
    expect(readPackageJson).toBeCalledWith('/root');
  });

  it('should compute current version from tags if package.json is not present', async () => {
    jest.spyOn(projectUtils, 'hasPackageJson').mockReturnValue(false);
    mockGitSemverTags.mockResolvedValue([
      'demo-2.1.0',
      'demo-2.0.0',
      'demo-1.0.0',
    ]);

    const version = await getCurrentVersion({
      projectRoot: '/root',
      tagPrefix: 'demo-',
    }).toPromise();

    expect(version).toEqual('2.1.0');
    expect(mockGitSemverTags).toBeCalledWith({ tagPrefix: 'demo-' });
  });

  it('should default to 0.0.0', async () => {
    jest.spyOn(projectUtils, 'hasPackageJson').mockReturnValue(false);
    mockGitSemverTags.mockResolvedValue([]);

    const version = await getCurrentVersion({
      projectRoot: '/root',
    }).toPromise();

    expect(version).toEqual('0.0.0');
    expect(hasPackageJson).toBeCalledWith('/root');
  });
});
