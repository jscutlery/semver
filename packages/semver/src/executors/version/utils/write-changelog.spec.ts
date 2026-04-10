import * as fs from 'fs';
import * as Stream from 'stream';
import * as createPreset from 'conventional-changelog-conventionalcommits';

import writeChangelog from './write-changelog';
import type { WriteChangelogConfig } from '../schema';
import { createConventionalCommitStream } from './conventional-commit';

jest.mock('./conventional-commit');
jest.mock('conventional-changelog-conventionalcommits');

/**
 * @todo: This test is disabled because it is not working in the CI environment.
 */

const config: WriteChangelogConfig = {
  changelogHeader: '# Changelog',
  projectRoot: './',
  preset: 'conventionalcommits',
  dryRun: false,
  changelogPath: 'CHANGELOG.md',
  tagPrefix: 'button',
};

describe(writeChangelog, () => {
  const createConventionalCommitStreamMock =
    createConventionalCommitStream as jest.MockedFunction<
      typeof createConventionalCommitStream
    >;
  const createPresetMock = createPreset as jest.MockedFunction<
    typeof createPreset
  >;
  const version = '1.0.0';

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => jest.fn());
    jest.spyOn(console, 'info').mockImplementation(() => jest.fn());
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => jest.fn());
    createPresetMock.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('preset forwarding', () => {
    beforeEach(() => {
      createConventionalCommitStreamMock.mockReturnValue(createMockStream());
    });

    it('preserves named preset objects with sibling overrides', async () => {
      const preset = {
        name: 'conventional-changelog-conventionalcommits-jira',
        issuePrefixes: ['YEUPSD', 'TANK'],
        issueUrlFormat:
          'https://yaradigitalfarming.atlassian.net/browse/{{prefix}}{{id}}',
      };

      await writeChangelog(
        {
          ...config,
          preset,
          dryRun: true,
        },
        version,
      );

      expect(createConventionalCommitStreamMock).toHaveBeenCalledWith(
        expect.objectContaining({
          preset,
        }),
        version,
      );
      expect(createPresetMock).not.toHaveBeenCalled();
    });

    it('resolves unnamed object presets before creating the stream', async () => {
      const preset = {
        types: [
          { type: 'feat', section: 'Awesome Features' },
          { type: 'fix', section: 'Important Fixes' },
        ],
      };
      const resolvedPreset = {
        commits: {},
        parser: {},
        writer: {},
        whatBump: jest.fn(),
      };
      createPresetMock.mockResolvedValue(resolvedPreset);

      await writeChangelog(
        {
          ...config,
          preset,
          dryRun: true,
        },
        version,
      );

      expect(createPresetMock).toHaveBeenCalledWith(preset);
      expect(createConventionalCommitStreamMock).toHaveBeenCalledWith(
        expect.objectContaining({
          preset: resolvedPreset,
        }),
        version,
      );
    });
  });

  xdescribe('handle errors', () => {
    beforeEach(async () => {
      createConventionalCommitStreamMock.mockReturnValue(
        new Stream.Readable({
          read() {
            this.emit('error', '💥');
          },
        }),
      );
      await writeChangelog(config, '0.0.1');
    });

    it('should print a console.warn', async () => {
      expect(console.warn).toHaveBeenCalledWith(
        'changelog creation failed',
        '💥',
      );
    });

    it('should not write a changelog file', async () => {
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  xdescribe('--dryRun', () => {
    const version = '1.0.0';

    beforeEach(async () => {
      createConventionalCommitStreamMock.mockImplementation(
        (
          jest.requireActual(
            './conventional-commit',
          ) as typeof import('./conventional-commit')
        ).createConventionalCommitStream,
      );
      await writeChangelog({ ...config, dryRun: true }, version);
    });

    it('should not write a changelog file', async () => {
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should print a console.info with the changelog contents without the header', async () => {
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(version),
      );
      expect(console.info).toHaveBeenCalledWith(
        expect.not.stringContaining(config.changelogHeader),
      );
    });
  });

  xdescribe('--preset', () => {
    const version = '1.0.0';

    beforeEach(async () => {
      createConventionalCommitStreamMock.mockImplementation(
        (
          jest.requireActual(
            './conventional-commit',
          ) as typeof import('./conventional-commit')
        ).createConventionalCommitStream,
      );
      await writeChangelog(
        {
          ...config,
          preset: {
            types: [
              { type: 'feat', section: 'Awesome Features' },
              { type: 'fix', section: 'Important Fixes' },
              { type: 'chore', hidden: true },
              { type: 'docs', hidden: true },
              { type: 'style', hidden: true },
              { type: 'refactor', hidden: true },
              { type: 'perf', hidden: true },
              { type: 'test', hidden: true },
            ],
          },
          dryRun: true,
        },
        version,
      );
    });

    it('should print changelog', () => {
      expect((console.info as jest.Mock).mock.calls[0][0]).toContain(
        'Awesome Features',
      );
      expect((console.info as jest.Mock).mock.calls[0][0]).toContain(
        'Important Fixes',
      );
    });
  });
});

function createMockStream() {
  const stream = new Stream.Readable({
    read() {
      this.push('## 1.0.0');
      this.push(null);
    },
  });

  return stream;
}
