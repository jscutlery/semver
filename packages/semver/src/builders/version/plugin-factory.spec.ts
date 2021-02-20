import { Observable } from 'rxjs';

import { SemverOptions, SemverPlugin } from './plugin';
import { PluginFactory, SemanticReleasePluginAdapter } from './plugin-factory';

jest.mock('./utils/filesystem');

describe(PluginFactory.name, () => {
  const semverOptions: SemverOptions = {
    projectRoot: '/root/packages/lib',
    packageRoot: '/root/dist/packages/lib',
    newVersion: '0.0.1',
    dryRun: false,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let semanticPluginSpy: any;
  let plugin: SemverPlugin;

  beforeEach(() => {
    semanticPluginSpy = {
      publish: jest.fn(),
      addChannel: jest.fn(),
      verifyConditions: jest.fn(),
    };

    semanticPluginSpy.publish.mockResolvedValue(undefined);
    semanticPluginSpy.addChannel.mockResolvedValue(undefined);
    semanticPluginSpy.verifyConditions.mockResolvedValue(undefined);

    plugin = PluginFactory.create({
      name: '@semantic-release/spy-plugin',
      plugin: semanticPluginSpy,
    });
  });

  describe(SemanticReleasePluginAdapter.name, () => {
    it(`should call semantic-release 'addChannel' and 'publish' hooks`, async () => {
      await (plugin.publish(semverOptions) as Observable<unknown>).toPromise();

      expect(semanticPluginSpy.addChannel).toBeCalled();
      expect(semanticPluginSpy.publish).toBeCalled();
      expect(semanticPluginSpy.publish).toHaveBeenCalledBefore(
        semanticPluginSpy.addChannel
      );
    });

    it(`should call semantic-release 'publish' hook with right options`, async () => {
      await (plugin.publish(semverOptions) as Observable<unknown>).toPromise();

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
      await (plugin.publish(semverOptions) as Observable<unknown>).toPromise();

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
  });

  it(`should handle semantic-release 'verifyOptions' failure`, async () => {
    semanticPluginSpy.verifyConditions.mockRejectedValue('failure');

    try {
      await(plugin.validate(semverOptions) as Observable<boolean>).toPromise();
      fail();
    } catch (error) {
      expect(error).toBe('failure');
    }
  });

  it(`should handle semantic-release 'verifyOptions' success`, async () => {
    semanticPluginSpy.verifyConditions.mockResolvedValue('success');

    expect(
      await (plugin.validate(semverOptions) as Observable<boolean>).toPromise()
    ).toBe('success');
  });

  it(`should call semantic-release 'verifyOptions' hook with right options`, async () => {
    await (plugin.validate(semverOptions) as Observable<boolean>).toPromise();

    expect(semanticPluginSpy.verifyConditions).toBeCalledWith(
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
