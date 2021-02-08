import { BuilderContext } from '@angular-devkit/architect';
import { of } from 'rxjs';

import { createPluginHandler } from './plugin-handler';
import { createFakeContext } from './testing';
import { CommonVersionOptions } from './version';

/* eslint-disable @typescript-eslint/no-var-requires */
const { publish: npmPublish } = require('@custom-plugin/npm');
const { publish: githubPublish } = require('@custom-plugin/github');
/* eslint-enable @typescript-eslint/no-var-requires */

jest.mock('./utils/filesystem');

jest.mock(
  '@custom-plugin/npm',
  () => ({
    name: '@custom-plugin/npm',
    type: '@jscutlery/semver-plugin',
    publish: jest.fn(),
  }),
  {
    virtual: true,
  }
);

jest.mock(
  '@custom-plugin/github',
  () => ({
    name: '@custom-plugin/github',
    type: '@jscutlery/semver-plugin',
    publish: jest.fn(),
  }),
  {
    virtual: true,
  }
);

jest.mock(
  '@custom-plugin/noop',
  () => ({
    name: '@custom-plugin/noop',
    type: '@jscutlery/semver-plugin',
  }),
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
    npmPublish.mockResolvedValue(undefined);
    githubPublish.mockResolvedValue(undefined);

    context = createFakeContext({
      project: 'lib',
      projectRoot: '/root/packages/lib',
      workspaceRoot: '/root',
    });

    (context.getTargetOptions as jest.Mock).mockResolvedValue({
      outputPath: 'dist/packages/lib',
    });
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

  it('should handle Observable', () => {
    npmPublish.mockReturnValue(of('Plugin A'));
    githubPublish.mockReturnValue(of('Plugin B'));

    const observerSpy = jest.fn();

    createPluginHandler({
      options,
      plugins: ['@custom-plugin/npm', '@custom-plugin/github'],
      context,
    })
      .publish()
      .subscribe(observerSpy, fail);

    expect(observerSpy.mock.calls[0][0]).toEqual('Plugin A');
    expect(observerSpy.mock.calls[1][0]).toEqual('Plugin B');
  });

  it('should handle Promise', (done) => {
    npmPublish.mockResolvedValue('Plugin A');
    githubPublish.mockResolvedValue('Plugin B');

    const observerSpy = jest.fn();

    createPluginHandler({
      options,
      plugins: ['@custom-plugin/npm', '@custom-plugin/github'],
      context,
    })
      .publish()
      .subscribe({
        next: observerSpy,
        error: fail,
        complete: () => {
          expect(observerSpy.mock.calls[0][0]).toEqual('Plugin A');
          expect(observerSpy.mock.calls[1][0]).toEqual('Plugin B');
          done();
        },
      });
  });

  it('should handle undefined hook', (done) => {
    npmPublish.mockResolvedValue('Plugin A');
    githubPublish.mockResolvedValue('Plugin B');

    const observerSpy = jest.fn();

    createPluginHandler({
      options,
      plugins: [
        '@custom-plugin/npm',
        '@custom-plugin/github',
        '@custom-plugin/noop',
      ],
      context,
    })
      .publish()
      .subscribe({
        next: observerSpy,
        error: fail,
        complete: () => {
          /* No publish hook defined for @custom-plugin/noop. */
          expect(observerSpy).toBeCalledTimes(2);
          expect(observerSpy).toHaveBeenNthCalledWith(1, 'Plugin A');
          expect(observerSpy).toHaveBeenNthCalledWith(2, 'Plugin B');
          done();
        },
      });
  });
});
