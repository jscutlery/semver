import { getPackageFiles, getProjectsRoot } from './workspace';

describe('getPackageFiles', () => {
  it('should resolve projects package.json', () => {
    expect(
      getPackageFiles([
        '/root/packages/a',
        '/root/packages/b',
      ])
    ).toEqual([
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
