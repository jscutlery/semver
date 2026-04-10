import * as conventionalChangelog from 'conventional-changelog';
import { createConventionalCommitStream } from './conventional-commit';
import type { WriteChangelogConfig } from '../schema';

jest.mock('conventional-changelog', () => jest.fn());

const config: WriteChangelogConfig = {
  changelogHeader: '# Changelog',
  projectRoot: './libs/demo',
  preset: 'conventionalcommits',
  dryRun: false,
  changelogPath: 'CHANGELOG.md',
  tagPrefix: 'demo-',
};

describe(createConventionalCommitStream.name, () => {
  const conventionalChangelogMock =
    conventionalChangelog as jest.MockedFunction<typeof conventionalChangelog>;

  beforeEach(() => {
    conventionalChangelogMock.mockReset();
  });

  it('should pass named preset objects as preset and config', () => {
    const preset = {
      name: 'conventional-changelog-conventionalcommits-jira',
      issuePrefixes: ['YEUPSD', 'TANK'],
      issueUrlFormat:
        'https://yaradigitalfarming.atlassian.net/browse/{{prefix}}{{id}}',
    };

    createConventionalCommitStream({ ...config, preset }, '1.0.0');

    expect(conventionalChangelogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        preset: 'conventional-changelog-conventionalcommits-jira',
        config: preset,
      }),
      { version: '1.0.0' },
      { path: './libs/demo' },
      undefined,
    );
  });

  it('should default unnamed preset objects to conventionalcommits', () => {
    const preset = {
      types: [{ type: 'feat', section: 'Awesome Features' }],
    };

    createConventionalCommitStream({ ...config, preset }, '1.0.0');

    expect(conventionalChangelogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: preset,
      }),
      { version: '1.0.0' },
      { path: './libs/demo' },
      undefined,
    );
  });
});
