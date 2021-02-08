import { Observable } from 'rxjs';

import { SemverOptions } from './plugin';
import { PluginFactory } from './plugin-factory';

jest.mock('./utils/filesystem');

describe('PluginFactory', () => {
  const semverOptions: SemverOptions = {
    projectRoot: '/root/packages/lib',
    packageRoot: '/root/dist/packages/lib',
    newVersion: '0.0.1',
    dryRun: false,
  };

  const semanticPluginSpy = {
    publish: jest.fn(),
    addChannel: jest.fn(),
    verifyConditions: jest.fn(),
  };

  beforeEach(() => {
    semanticPluginSpy.publish.mockResolvedValue(undefined);
    semanticPluginSpy.addChannel.mockResolvedValue(undefined);
    semanticPluginSpy.verifyConditions.mockResolvedValue(undefined);
  });

  it(`should call semantic-release 'addChannel' and 'publish' hooks`, async () => {
    const plugin = PluginFactory.create({
      name: '@semantic-release/spy-plugin',
      plugin: semanticPluginSpy,
    });

    await(plugin.publish(semverOptions) as Observable<unknown>).toPromise();

    expect(semanticPluginSpy.addChannel).toBeCalled();
    expect(semanticPluginSpy.publish).toBeCalled();
    expect(semanticPluginSpy.publish).toHaveBeenCalledBefore(
      semanticPluginSpy.addChannel
    );
  });

  it(`should call semantic-release 'publish' hook with right options`, async () => {
    const plugin = PluginFactory.create({
      name: '@semantic-release/spy-plugin',
      plugin: semanticPluginSpy,
    });

    await(plugin.publish(semverOptions) as Observable<unknown>).toPromise();

    expect(semanticPluginSpy.publish).toBeCalledWith(
      expect.objectContaining({
        npmPublish: true,
        pkgRoot: '/root/dist/packages/lib',
      }),
      expect.objectContaining({
        cwd: '/root/packages/lib',
        env: expect.any(Object),
        stderr: expect.anything(),
        stdout: expect.anything(),
        logger: expect.objectContaining({
          log: expect.any(Function),
        }),
        nextRelease: expect.objectContaining({
          version: '0.0.1', // @todo test dist tag / channel
        }),
      })
    );
  });

  it(`should call semantic-release 'addChannel' hook with right options`, async () => {
    const plugin = PluginFactory.create({
      name: '@semantic-release/spy-plugin',
      plugin: semanticPluginSpy,
    });

    await(plugin.publish(semverOptions) as Observable<unknown>).toPromise();

    expect(semanticPluginSpy.addChannel).toBeCalledWith(
      expect.objectContaining({
        pkgRoot: '/root/dist/packages/lib',
        npmPublish: true,
      }),
      expect.objectContaining({
        cwd: '/root/packages/lib',
        env: expect.any(Object),
        stderr: expect.anything(),
        stdout: expect.anything(),
        logger: expect.objectContaining({
          log: expect.any(Function),
        }),
        nextRelease: expect.objectContaining({
          version: '0.0.1', // @todo test dist tag / channel
        }),
      })
    );
  });

  it(`should fail for unsupported plugin`, async () => {
    expect(() =>
      PluginFactory.create({
        name: '@semantic-release/spy-plugin',
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        plugin: { noop() {} },
      })
    ).toThrow('Plugin not supported');
  });
});
