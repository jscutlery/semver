import { Architect } from '@angular-devkit/architect';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { schema } from '@angular-devkit/core';
import { join } from 'path';
import * as standardVersion from 'standard-version';

import { VersionBuilderSchema } from './schema';

jest.mock('standard-version', () => jest.fn(() => Promise.resolve()));

const options: VersionBuilderSchema = {
  dryRun: false,
  noVerify: false,
  firstRelease: false,
};

describe('@jscutlery/semver:version', () => {
  let architect: Architect;
  let architectHost: TestingArchitectHost;

  beforeEach(async () => {
    const registry = new schema.CoreSchemaRegistry();
    registry.addPostTransform(schema.transforms.addUndefinedDefaults);

    architectHost = new TestingArchitectHost('/root', '/root');
    architect = new Architect(architectHost, registry);

    await architectHost.addBuilderFromPackage(join(__dirname, '../../..'));
  });

  it('runs standard-version', async () => {
    const run = await architect.scheduleBuilder(
      '@jscutlery/semver:version',
      options
    );
    const output = await run.result;

    await run.stop();

    expect(output.success).toBe(true);
    expect(standardVersion).toBeCalledWith(
      expect.objectContaining({
        silent: false,
        dryRun: false,
        noVerify: false,
        firstRelease: false,
        path: '/root/lib',
        infile: '/root/lib/CHANGELOG.md',
        bumpFiles: ['/root/lib/package.json'],
        packageFiles: ['/root/lib/package.json'],
      })
    );
  });
});
