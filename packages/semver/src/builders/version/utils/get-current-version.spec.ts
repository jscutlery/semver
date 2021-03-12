import * as gitSemverTags from 'git-semver-tags';
import { of, throwError } from 'rxjs';
import { callbackify } from 'util';

import { getCurrentVersion } from './get-current-version';
import * as gitUtils from './git';

jest.mock('git-semver-tags', () => jest.fn());
jest.mock('./project');
jest.mock('./git');

const tagPrefix = 'v';

describe('getCurrentVersion', () => {
  let mockGitSemverTags: jest.Mock;

  beforeEach(() => {
    mockGitSemverTags = jest.fn();
    (gitSemverTags as jest.Mock).mockImplementation(
      callbackify(mockGitSemverTags)
    );
  });

  it('should compute current version from previous semver tag', async () => {
    mockGitSemverTags.mockResolvedValue(['v2.1.0', 'v2.0.0', 'v1.0.0']);

    const version = await getCurrentVersion({ tagPrefix }).toPromise();

    expect(version).toEqual('v2.1.0');
  });

  it('should compute current version from last tag if no semver tag was found', async () => {
    mockGitSemverTags.mockResolvedValue([]);
    jest.spyOn(gitUtils, 'getLastTag').mockReturnValue(of('v2.1.0'));

    const version = await getCurrentVersion({ tagPrefix }).toPromise();

    expect(version).toEqual('v2.1.0');
  });

  it('should default to 0.0.0', async () => {
    mockGitSemverTags.mockResolvedValue([]);
    jest
      .spyOn(gitUtils, 'getLastTag')
      .mockReturnValue(throwError('No tag found'));

    const version = await getCurrentVersion({ tagPrefix }).toPromise();

    expect(version).toEqual('v0.0.0');
  });
});
