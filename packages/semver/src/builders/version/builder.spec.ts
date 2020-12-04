import { MockBuilderContext } from '@nrwl/workspace/testing';
import * as standardVersion from 'standard-version';

import { getMockContext } from '../../utils/testing';
import { runBuilder } from './builder';
import { VersionBuilderSchema } from './schema';

jest.mock('standard-version', () => jest.fn(() => Promise.resolve()));

const options: VersionBuilderSchema = {
  dryRun: false,
  noVerify: false,
  firstRelease: false,
};

describe('@jscutlery/semver:version', () => {
  let context: MockBuilderContext;

  beforeEach(async () => {
    context = await getMockContext();
    context.getProjectMetadata = jest.fn().mockResolvedValue({ root: '/root/lib' })
  });

  it('runs standard-version with project options', async () => {
    await runBuilder(options, context).toPromise();
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
