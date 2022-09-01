import * as gitSemverTags from 'git-semver-tags';
import { lastValueFrom } from 'rxjs';
import { callbackify } from 'util';

import { getLastVersion } from './get-last-version';

jest.mock('git-semver-tags', () => jest.fn());
jest.mock('./project');

const tagPrefix = 'my-lib-';

describe(getLastVersion.name, () => {
  let mockGitSemverTags: jest.Mock;

  beforeEach(() => {
    mockGitSemverTags = jest.fn();
    (gitSemverTags as jest.Mock).mockImplementation(
      callbackify(mockGitSemverTags)
    );
  });

  it('should compute current version from previous semver tag', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.1.0',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);

    const tag = await lastValueFrom(getLastVersion({ tagPrefix }));

    expect(tag).toEqual('2.1.0');
  });

  it('should compute current version from previous semver prerelease tag with corresponding preid', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.1.0-z-is-the-last-letter-in-alphabet.0',
      'my-lib-2.1.0-add-feature.5',
      'my-lib-2.1.0-fix-bug.0',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);

    const tag = await lastValueFrom(getLastVersion({ tagPrefix }));
    const tagWithPreidFeat = await lastValueFrom(
      getLastVersion({ tagPrefix, preid: 'add-feature' })
    );
    const tagWithPreidFix = await lastValueFrom(
      getLastVersion({ tagPrefix, preid: 'fix-bug' })
    );

    expect(tag).toEqual('2.1.0-z-is-the-last-letter-in-alphabet.0');

    expect(tagWithPreidFeat).toEqual('2.1.0-add-feature.5');
    expect(tagWithPreidFix).toEqual('2.1.0-fix-bug.0');
  });

  it('should compute current version from previous semver release tag', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.1.0-beta.0',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);

    const tag = await lastValueFrom(
      getLastVersion({ tagPrefix, includePrerelease: false })
    );

    expect(tag).toEqual('2.0.0');
  });

  it('should throw error if no tag available', async () => {
    mockGitSemverTags.mockResolvedValue([]);

    expect(lastValueFrom(getLastVersion({ tagPrefix }))).rejects.toThrow(
      'No semver tag found'
    );
  });
});
