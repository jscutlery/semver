import * as fs from 'fs';
import * as Stream from 'stream';
import { jest } from '@jest/globals';

import writeChangelog from './write-changelog';
import type { WriteChangelogConfig } from '../schema';
import { createConventionalCommitStream } from './conventional-commit';

jest.mock('./conventional-commit');

const config: WriteChangelogConfig = {
  changelogHeader: '# Changelog',
  projectRoot: './',
  preset: 'angular',
  dryRun: false,
  changelogPath: 'CHANGELOG.md',
  tagPrefix: 'button',
};

describe(writeChangelog, () => {
  const createConventionalCommitStreamMock =
    createConventionalCommitStream as jest.Mock<
      typeof createConventionalCommitStream
    >;

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => jest.fn());
    jest.spyOn(console, 'info').mockImplementation(() => jest.fn());
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle errors', () => {
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

  describe('--dryRun', () => {
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

  describe('--preset', () => {
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

    it('should load custom preset', () => {
      expect(
        createConventionalCommitStreamMock.mock.calls[0][0].preset,
      ).toMatchSnapshot();
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
