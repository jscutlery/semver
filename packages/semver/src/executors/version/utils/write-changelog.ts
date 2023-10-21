import * as chalk from 'chalk';
import * as createPreset from 'conventional-changelog-conventionalcommits';
import { accessSync, constants, readFileSync, writeFileSync } from 'fs';
import { WriteChangelogConfig } from '../schema';
import { createConventionalCommitStream } from './conventional-commit';

const START_OF_LAST_RELEASE_PATTERN =
  /(^#+ \[?[0-9]+\.[0-9]+\.[0-9]+|<a name=)/m;

export default function writeChangelog(
  config: WriteChangelogConfig,
  newVersion: string,
): Promise<void> {
  return buildConventionalChangelog(config, newVersion)
    .then((newContent) => {
      if (config.dryRun) {
        return console.info(`\n---\n${chalk.gray(newContent.trim())}\n---\n`);
      }

      try {
        accessSync(config.changelogPath, constants.F_OK);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          writeFileSync(config.changelogPath, '\n', 'utf8');
        }
      }

      return writeFileSync(
        config.changelogPath,
        config.changelogHeader +
          '\n' +
          (newContent + buildExistingContent(config)).replace(/\n+$/, '\n'),
        'utf8',
      );
    })
    .catch((err) => {
      console.warn('changelog creation failed', err);
      return err;
    });
}

function buildExistingContent(config: WriteChangelogConfig) {
  const existingContent = readFileSync(config.changelogPath, 'utf-8');
  const existingContentStart = existingContent.search(
    START_OF_LAST_RELEASE_PATTERN,
  );
  // find the position of the last release and remove header:
  if (existingContentStart !== -1) {
    return existingContent.substring(existingContentStart);
  }

  return existingContent;
}

async function buildConventionalChangelog(
  config: WriteChangelogConfig,
  newVersion: string,
): Promise<string> {
  const preset =
    typeof config.preset === 'object'
      ? await createPreset(config.preset)
      : config.preset;

  return new Promise((resolve, reject) => {
    let changelog = '';
    const changelogStream = createConventionalCommitStream(
      { ...config, preset },
      newVersion,
    );

    changelogStream.on('error', function (err) {
      reject(err);
    });

    changelogStream.on('data', function (buffer: ArrayBuffer) {
      changelog += buffer.toString();
    });

    changelogStream.on('end', function () {
      resolve(changelog);
    });
  });
}
