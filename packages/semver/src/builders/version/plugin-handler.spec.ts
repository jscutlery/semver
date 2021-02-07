import { BuilderContext } from '@angular-devkit/architect';

import { createPluginHandler } from './plugin-handler';
import { createFakeContext } from './testing';
import { CommonVersionOptions } from './version';
import { readJsonFile } from './utils/filesystem';
import { of } from 'rxjs';

/* eslint-disable @typescript-eslint/no-var-requires */
const { publish: npmPublish } = require('@custom-plugin/npm');
const { publish: githubPublish } = require('@custom-plugin/github');
/* eslint-enable @typescript-eslint/no-var-requires */

jest.mock('./utils/filesystem');

jest.mock(
  '@custom-plugin/npm',
  () => ({ publish: jest.fn(), type: '@jscutlery/semver-plugin' }),
  {
    virtual: true,
  }
);

jest.mock(
  '@custom-plugin/github',
  () => ({ publish: jest.fn(), type: '@jscutlery/semver-plugin' }),
  {
    virtual: true,
  }
);

describe('PluginHandler', () => {
  const options: CommonVersionOptions = {
    dryRun: false,
    noVerify: false,
    newVersion: '0.0.1',
    preset: 'angular',
    projectRoot: '/root/packages/lib',
    tagPrefix: 'v',
  };

  let context: BuilderContext;

  beforeEach(() => {
    npmPublish.mockResolvedValue('');
    githubPublish.mockResolvedValue('');

    context = createFakeContext({
      project: 'lib',
      projectRoot: '/root/packages/lib',
      workspaceRoot: '/root',
    });

    (context.getTargetOptions as jest.Mock).mockResolvedValue({
      outputPath: 'dist/packages/lib',
    });

    (readJsonFile as jest.Mock).mockReturnValue(
      of({ name: '@my-package', version: '0.0.0' })
    );
  });

  afterEach(() => {
    npmPublish.mockRestore();
    githubPublish.mockRestore();
  });

  it('should handle one plugin', async () => {
    await createPluginHandler({
      options,
      plugins: ['@custom-plugin/npm'],
      context,
    })
      .publish()
      .toPromise();

    expect(npmPublish).toBeCalledTimes(1);
    expect(githubPublish).not.toBeCalled();
  });

  it('should handle multiple plugins', async () => {
    await createPluginHandler({
      options,
      plugins: ['@custom-plugin/npm', '@custom-plugin/github'],
      context,
    })
      .publish()
      .toPromise();

    expect(npmPublish).toBeCalledTimes(1);
    expect(githubPublish).toBeCalledTimes(1);
    expect(npmPublish).toHaveBeenCalledBefore(githubPublish);
  });

  it('should handle plugin configuration', async () => {
    await createPluginHandler({
      options,
      plugins: [
        '@custom-plugin/npm',
        ['@custom-plugin/github', { remoteUrl: 'remote' }],
      ],
      context,
    })
      .publish()
      .toPromise();

    expect(githubPublish.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        remoteUrl: 'remote',
      })
    );
    expect(npmPublish.mock.calls[0][0]).toEqual(
      {} // <- Empty options
    );
  });
});
