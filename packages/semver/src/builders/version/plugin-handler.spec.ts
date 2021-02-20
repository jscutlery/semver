import { BuilderContext } from '@angular-devkit/architect';
import { of } from 'rxjs';

import { createPluginHandler, PluginHandler } from './plugin-handler';
import { createFakeContext } from './testing';
import { CommonVersionOptions } from './version';

/* eslint-disable @typescript-eslint/no-var-requires */
const {
  publish: mockPublishA,
  validate: mockValidateA,
} = require('@mock-plugin/A');
const {
  publish: mockPublishB,
  validate: mockValidateB,
} = require('@mock-plugin/B');
const {
  publish: mockPublishC,
  validate: mockValidateC,
} = require('@mock-plugin/C');
/* eslint-enable @typescript-eslint/no-var-requires */

jest.mock('./utils/filesystem');

jest.mock(
  '@mock-plugin/A',
  () => ({
    name: '@mock-plugin/A',
    type: '@jscutlery/semver-plugin',
    validate: jest.fn(),
    prepare: jest.fn(),
    publish: jest.fn(),
  }),
  {
    virtual: true,
  }
);

jest.mock(
  '@mock-plugin/B',
  () => ({
    name: '@mock-plugin/B',
    type: '@jscutlery/semver-plugin',
    validate: jest.fn(),
    prepare: jest.fn(),
    publish: jest.fn(),
  }),
  {
    virtual: true,
  }
);

jest.mock(
  '@mock-plugin/C',
  () => ({
    name: '@mock-plugin/C',
    type: '@jscutlery/semver-plugin',
    validate: jest.fn(),
    prepare: jest.fn(),
    publish: jest.fn(),
  }),
  {
    virtual: true,
  }
);

jest.mock(
  '@mock-plugin/noop',
  () => ({
    name: '@mock-plugin/noop',
    type: '@jscutlery/semver-plugin',
  }),
  {
    virtual: true,
  }
);

describe(PluginHandler.name, () => {
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
    mockPublishA.mockResolvedValue(undefined);
    mockPublishB.mockResolvedValue(undefined);
    mockPublishC.mockResolvedValue(undefined);

    context = createFakeContext({
      project: 'lib',
      projectRoot: '/root/packages/lib',
      workspaceRoot: '/root',
    });
  });

  afterEach(() => {
    mockPublishA.mockRestore();
    mockPublishB.mockRestore();
    mockPublishC.mockRestore();
  });

  it('should handle multiple plugins', async () => {
    await createPluginHandler({
      options,
      plugins: ['@mock-plugin/A', '@mock-plugin/C'],
      context,
    })
      .publish()
      .toPromise();

    expect(mockPublishA).toBeCalledTimes(1);
    expect(mockPublishB).not.toBeCalled();
    expect(mockPublishC).toBeCalledTimes(1);
  });

  it('should handle plugins in order', async () => {
    await createPluginHandler({
      options,
      plugins: ['@mock-plugin/A', '@mock-plugin/B', '@mock-plugin/C'],
      context,
    })
      .publish()
      .toPromise();

    expect(mockPublishA).toBeCalledTimes(1);
    expect(mockPublishB).toBeCalledTimes(1);
    expect(mockPublishC).toBeCalledTimes(1);
    expect(mockPublishA).toHaveBeenCalledBefore(mockPublishB);
    expect(mockPublishB).toHaveBeenCalledBefore(mockPublishC);
  });

  it('should handle plugin options', async () => {
    await createPluginHandler({
      options,
      plugins: [
        '@mock-plugin/A',
        { module: '@mock-plugin/B', options: { remoteUrl: 'remote' } },
        { module: '@mock-plugin/C' },
      ],
      context,
    })
      .publish()
      .toPromise();

    expect(mockPublishA.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        projectRoot: '/root/packages/lib',
        packageRoot: '/root/dist/packages/lib',
        newVersion: '0.0.1',
        dryRun: false,
      })
    );
    expect(mockPublishA.mock.calls[0][1]).toEqual(
      {} // <- Empty options
    );
    expect(mockPublishB.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        projectRoot: '/root/packages/lib',
        packageRoot: '/root/dist/packages/lib',
        newVersion: '0.0.1',
        dryRun: false,
      })
    );
    expect(mockPublishB.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        remoteUrl: 'remote',
      })
    );
    expect(mockPublishC.mock.calls[0][0]).toEqual({
      projectRoot: '/root/packages/lib',
      packageRoot: '/root/dist/packages/lib',
      newVersion: '0.0.1',
      dryRun: false,
    });
    expect(mockPublishC.mock.calls[0][1]).toEqual(
      {} // <- Empty options
    );
  });

  it('should handle Observable hook result', (done) => {
    mockPublishA.mockReturnValue(of('Plugin A'));
    mockPublishB.mockReturnValue(of('Plugin B'));

    const observerSpy = jest.fn();

    createPluginHandler({
      options,
      plugins: ['@mock-plugin/A', '@mock-plugin/B'],
      context,
    })
      .publish()
      .subscribe(observerSpy, fail, () => {
        expect(observerSpy).toBeCalledTimes(2);
        expect(observerSpy.mock.calls[0][0]).toEqual('Plugin A');
        expect(observerSpy.mock.calls[1][0]).toEqual('Plugin B');
        done();
      });
  });

  it('should handle Promise hook result', (done) => {
    mockPublishA.mockResolvedValue('Plugin A');
    mockPublishB.mockResolvedValue('Plugin B');

    const observerSpy = jest.fn();

    createPluginHandler({
      options,
      plugins: ['@mock-plugin/A', '@mock-plugin/B'],
      context,
    })
      .publish()
      .subscribe({
        next: observerSpy,
        error: fail,
        complete: () => {
          expect(observerSpy).toBeCalledTimes(2);
          expect(observerSpy.mock.calls[0][0]).toEqual('Plugin A');
          expect(observerSpy.mock.calls[1][0]).toEqual('Plugin B');
          done();
        },
      });
  });

  it('should not fail with undefined hook', (done) => {
    mockPublishA.mockResolvedValue('Plugin A');
    mockPublishB.mockResolvedValue('Plugin B');

    const observerSpy = jest.fn();

    createPluginHandler({
      options,
      plugins: ['@mock-plugin/A', '@mock-plugin/B', '@mock-plugin/noop'],
      context,
    })
      .publish()
      .subscribe({
        next: observerSpy,
        error: fail,
        complete: () => {
          /* No publish hook defined for @mock-plugin/noop, it just pass to the next plugin. */
          expect(observerSpy).toBeCalledTimes(2);
          expect(observerSpy).toHaveBeenNthCalledWith(1, 'Plugin A');
          expect(observerSpy).toHaveBeenNthCalledWith(2, 'Plugin B');
          done();
        },
      });
  });

  it(`should handle 'validate' hook`, (done) => {
    mockValidateA.mockResolvedValue(true);
    mockValidateB.mockResolvedValue(false);
    mockValidateC.mockResolvedValue(true);

    const observerSpy = jest.fn();

    createPluginHandler({
      options,
      plugins: ['@mock-plugin/A', '@mock-plugin/B', '@mock-plugin/C'],
      context,
    })
      .validate()
      .subscribe({
        next: observerSpy,
        error: fail,
        complete: () => {
          expect(observerSpy).toBeCalledTimes(3);
          expect(observerSpy).toHaveBeenNthCalledWith(1, true);
          expect(observerSpy).toHaveBeenNthCalledWith(2, false);
          expect(observerSpy).toHaveBeenNthCalledWith(3, true);
          done();
        },
      });
  });

  it(`should fail if some 'validate' hook result is not boolean`, (done) => {
    mockValidateA.mockResolvedValue(true);
    mockValidateB.mockResolvedValue('invalid');
    mockValidateC.mockResolvedValue(true); /* <- Never called */

    const observerSpy = jest.fn();

    createPluginHandler({
      options,
      plugins: ['@mock-plugin/A', '@mock-plugin/B', '@mock-plugin/C'],
      context,
    })
      .validate()
      .subscribe({
        next: observerSpy,
        error: (error) => {
          expect(observerSpy).toBeCalledTimes(1);
          expect(observerSpy).toHaveBeenNthCalledWith(1, true);
          expect(error.message).toContain(
            "Typeof result from 'validate' hook not expected, received: string"
          );
          done();
        },
      });
  });
});
