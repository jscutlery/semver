import * as fs from 'fs';
import { callbackify } from 'util';

import { getPackageFiles, getProjectsRoot, readPackageJson } from './workspace';

describe('getPackageFiles', () => {
  it('should resolve projects package.json', () => {
    expect(getPackageFiles(['/root/packages/a', '/root/packages/b'])).toEqual([
      '/root/packages/a/package.json',
      '/root/packages/b/package.json',
    ]);
  });
});

describe('getProjectsRoot', () => {
  it('should resolve projects root', () => {
    expect(
      getProjectsRoot({
        workspaceRoot: '/root',
        config: {
          name: 'cdk',
          type: 'sync-group',
          path: 'packages/cdk',
          packages: ['packages/cdk/helpers', 'packages/cdk/operators'],
        },
      })
    ).toIncludeAllMembers([
      '/root/packages/cdk/helpers',
      '/root/packages/cdk/operators',
    ]);
  });
});

describe('readPackageJson', () => {
  it('should read package.json', async () => {
    jest.spyOn(fs, 'readFile').mockImplementation(
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      callbackify(jest.fn().mockResolvedValue(`{"version":"2.1.0"}`)) as any
    );

    const content = await readPackageJson('/root').toPromise();
    expect(content).toEqual({
      version: '2.1.0',
    });
  });
});
