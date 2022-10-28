import * as chalk from 'chalk';
import * as conventionalChangelog from 'conventional-changelog';
import { accessSync, constants, readFileSync, writeFileSync } from 'fs';
import { WriteChangelogConfig } from '../schema';

const START_OF_LAST_RELEASE_PATTERN =
  /(^#+ \[?[0-9]+\.[0-9]+\.[0-9]+|<a name=)/m;

export default async function writeChangelog(
  config: WriteChangelogConfig,
  newVersion: string
) {
  const header = config.header;

  try {
    accessSync(config.infile, constants.F_OK);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      writeFileSync(config.infile, '\n', 'utf8');
    }
  }

  const existingContent = buildExistingContent(config);
  const newContent = await buildConventionalChangelog(config, newVersion);

  if (config.dryRun) {
    return console.info(`\n---\n${chalk.gray(newContent.trim())}\n---\n`);
  }
  return writeFileSync(
    config.infile,
    header + '\n' + (newContent + existingContent).replace(/\n+$/, '\n'),
    'utf8'
  );
}

function buildExistingContent(config: WriteChangelogConfig) {
  if (config.dryRun) {
    return '';
  }
  const existingContent = readFileSync(config.infile, 'utf-8');
  const existingContentStart = existingContent.search(
    START_OF_LAST_RELEASE_PATTERN
  );
  // find the position of the last release and remove header:
  if (existingContentStart !== -1) {
    return existingContent.substring(existingContentStart);
  }

  return existingContent;
}

function buildConventionalChangelog(
  config: WriteChangelogConfig,
  newVersion: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let changelog = '';
    const context = { version: newVersion };
    const changelogStream = conventionalChangelog(
      {
        preset: config.preset || 'angular',
        tagPrefix: config.tagPrefix,
      },
      context,
      { merges: null, path: config.path } as conventionalChangelog.Options
    ).on('error', function (err: unknown) {
      return reject(err);
    });

    changelogStream.on('data', function (buffer: ArrayBuffer) {
      changelog += buffer.toString();
    });

    changelogStream.on('end', function () {
      return resolve(changelog);
    });
  });
}
