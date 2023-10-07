import * as fs from 'fs';
import * as Stream from 'stream';

import { initConventionalCommitReadableStream } from './init-conventional-commit-readable-stream';
import writeChangelog from './write-changelog';

jest.mock('./init-conventional-commit-readable-stream');

const mockInitConventionalCommitReadableStream =
  initConventionalCommitReadableStream as jest.MockedFunction<
    typeof initConventionalCommitReadableStream
  >;

const config = {
  changelogHeader: '# Changelog',
  projectRoot: './',
  preset: 'angular',
  dryRun: false,
  changelogPath: 'CHANGELOG.md',
  tagPrefix: 'button',
};

describe('writeChangelog', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(fs, 'writeFileSync').mockImplementation();
  });
  afterAll(() => {
    (console.warn as jest.Mock).mockRestore();
    (console.info as jest.Mock).mockRestore();
    (fs.writeFileSync as jest.Mock).mockRestore();
    mockInitConventionalCommitReadableStream.mockRestore();
  });

  describe('handle buildConventionalChangelog error', () => {
    beforeAll(async () => {
      mockInitConventionalCommitReadableStream.mockReturnValue(
        new Stream.Readable({
          read() {
            this.emit('error', '💥');
          },
        }),
      );
      await writeChangelog(config, '0.0.1');
    });

    afterAll(() => {
      (console.warn as jest.Mock).mockClear();
      (console.info as jest.Mock).mockClear();
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
    const version = '0.0.1-rc1';

    beforeAll(async () => {
      mockInitConventionalCommitReadableStream.mockImplementation(
        jest.requireActual('./init-conventional-commit-readable-stream')
          .initConventionalCommitReadableStream,
      );

      await writeChangelog({ ...config, dryRun: true }, version);
    });

    afterAll(() => {
      (console.warn as jest.Mock).mockClear();
      (console.info as jest.Mock).mockClear();
    });

    it('should not write a changelog file', async () => {
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
    it('should print a console.info with the changelog contents without the header', async () => {
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(`## ${version}`),
      );
      expect(console.info).toHaveBeenCalledWith(
        expect.not.stringContaining(config.changelogHeader),
      );
    });
  });
});
