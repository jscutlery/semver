import { BuilderContext } from '@angular-devkit/architect';

import { createPluginHandler } from './plugin-handler';
import { createFakeContext } from './testing';
import { CommonVersionOptions } from './version';
import { readJsonFile } from './utils/filesystem';
import { of } from 'rxjs'

/* eslint-disable @typescript-eslint/no-var-requires */
const { publish: npmPublish } = require('@custom-plugin/npm');
const { publish: githubPublish } = require('@custom-plugin/github');
const {
  publish: semanticPublish,
  addChannel: semanticAddChannel,
} = require('@semantic-release/npm');
/* eslint-enable @typescript-eslint/no-var-requires */

jest.mock('./utils/filesystem')

jest.mock(
  '@semantic-release/npm',
  () => ({ publish: jest.fn(), addChannel: jest.fn() }),
  { virtual: true }
);

jest.mock('@custom-plugin/npm', () => ({ publish: jest.fn() }), {
  virtual: true,
});

jest.mock('@custom-plugin/github', () => ({ publish: jest.fn() }), {
  virtual: true,
});

describe('Plugin', () => {
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
    semanticPublish.mockResolvedValue('');
    semanticAddChannel.mockResolvedValue('');

    context = createFakeContext({
      project: 'lib',
      projectRoot: '/root/packages/lib',
      workspaceRoot: '/root',
    });

    (context.getTargetOptions as jest.Mock).mockResolvedValue({
      outputPath: 'dist/packages/lib',
    });

    (readJsonFile as jest.Mock).mockReturnValue(
      // @todo handle dist-tag, registry ... see https://github.com/semantic-release/npm/blob/94679aeb0d22b665aa8fd8c7ea69be5d1828887b/test/integration.test.js#L239
      of({ name: '@my-package', version: '0.0.0' })
    );
  });

  afterEach(() => {
    npmPublish.mockRestore();
    githubPublish.mockRestore();
    semanticPublish.mockRestore();
    semanticAddChannel.mockRestore();
  });

  it('should run publish hook', async () => {
    await createPluginHandler({
      options,
      plugins: ['@custom-plugin/npm', '@custom-plugin/github'],
      context,
    })
      .publish()
      .toPromise();

    expect(npmPublish).toBeCalledTimes(1);
    expect(githubPublish).toBeCalledTimes(1);
    expect(
      semanticPublish /* @semantic-release/npm not declared and not called. */
    ).not.toBeCalled();
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

    expect(githubPublish).toBeCalledWith(
      expect.objectContaining({
        remoteUrl: 'remote',
      }),
      options,
      context
    );
    expect(npmPublish).toBeCalledWith({}, options, context);
  });

  it('should handle semantic-release plugins', async () => {
    await createPluginHandler({
      options,
      plugins: ['@semantic-release/npm'],
      context,
    })
      .publish()
      .toPromise();

    expect(semanticPublish).toBeCalledWith(
      '/root/.npmrc',
      expect.objectContaining({
        npmPublish: true,
        pkgRoot: '/root/dist/packages/lib',
      }),
      expect.objectContaining({ name: '@my-package', version: '0.0.0' }),
      expect.objectContaining({
        cwd: '/root/packages/lib',
        env: expect.any(Object),
        stderr: expect.anything(),
        stdout: expect.anything(),
        logger: expect.objectContaining({
          log: expect.any(Function),
        }),
        nextRelease: expect.objectContaining({
          version: '0.0.1',
        }),
      })
    );
    expect(semanticAddChannel).toBeCalledWith(
      '/root/.npmrc',
      expect.objectContaining({
        pkgRoot: '/root/dist/packages/lib',
        npmPublish: true,
      }),
      expect.objectContaining({ name: '@my-package', version: '0.0.0' }),
      expect.objectContaining({
        cwd: '/root/packages/lib',
        env: expect.any(Object),
        stderr: expect.anything(),
        stdout: expect.anything(),
        logger: expect.objectContaining({
          log: expect.any(Function),
        }),
        nextRelease: expect.objectContaining({
          version: '0.0.1',
        }),
      })
    );
  });
});
