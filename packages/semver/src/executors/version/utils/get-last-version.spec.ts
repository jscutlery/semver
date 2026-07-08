import * as gitSemverTags from 'git-semver-tags';
import { getLastVersion } from './get-last-version';

jest.mock('git-semver-tags');

const tagPrefix = 'my-lib-';

describe(getLastVersion.name, () => {
  const mockGitSemverTags: jest.Mock = gitSemverTags;

  beforeEach(() => {
    mockGitSemverTags.mockReset();
  });

  it('should compute current version from previous semver tag', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.1.0',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);

    const tag = await getLastVersion({ tagPrefix });

    expect(tag).toEqual('2.1.0');
  });

  it('should filter out prereleases with different preid when preid is specified', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.1.0-add-feature.5',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);

    const tag = await getLastVersion({ tagPrefix, preid: 'new-feature' });

    expect(tag).toEqual('2.0.0');
  });

  it('should compute current version from previous semver prerelease tag with corresponding preid', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.1.0-z-is-the-last-letter-in-alphabet.0',
      'my-lib-2.1.0-add-feature.5',
      'my-lib-2.1.0-fix-bug.0',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);

    const tag = await getLastVersion({ tagPrefix, releaseType: 'prerelease' });
    const tagWithPreidFeat = await getLastVersion({
      tagPrefix,
      releaseType: 'prerelease',
      preid: 'add-feature',
    });
    const tagWithPreidFix = await getLastVersion({
      tagPrefix,
      releaseType: 'prerelease',
      preid: 'fix-bug',
    });

    expect(tag).toEqual('2.1.0-z-is-the-last-letter-in-alphabet.0');
    expect(tagWithPreidFeat).toEqual('2.1.0-add-feature.5');
    expect(tagWithPreidFix).toEqual('2.1.0-fix-bug.0');
  });

  it('should compute current version from highest version including prereleases', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.1.0-beta.0',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);

    const tag = await getLastVersion({ tagPrefix });

    expect(tag).toEqual('2.1.0-beta.0');
  });

  it('should return highest prerelease when multiple prereleases exist', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-3.0.0-rc.1',
      'my-lib-3.0.0-rc.0',
      'my-lib-2.5.0',
      'my-lib-2.0.0',
    ]);

    const tag = await getLastVersion({ tagPrefix });

    expect(tag).toEqual('3.0.0-rc.1');
  });

  it('should filter out prereleases with different preid when preid is specified', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.1.0-add-feature.5',
      'my-lib-2.0.0',
      'my-lib-1.0.0',
    ]);

    const tag = await getLastVersion({ tagPrefix, preid: 'new-feature' });

    expect(tag).toEqual('2.0.0');
  });

  it('should include stable releases when searching for matching preid', async () => {
    mockGitSemverTags.mockResolvedValue([
      'my-lib-2.2.0',
      'my-lib-2.1.0-beta.5',
      'my-lib-2.0.0',
    ]);

    const tag = await getLastVersion({ tagPrefix, preid: 'beta' });

    expect(tag).toEqual('2.2.0');
  });

  it('should throw error if no tag available', async () => {
    mockGitSemverTags.mockResolvedValue([]);

    expect(getLastVersion({ tagPrefix })).rejects.toThrow(
      'No semver tag found',
    );
  });
});
