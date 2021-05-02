import { getPackageFiles } from './workspace';

describe('getPackageFiles', () => {
  it('should return projects package.json path', async () => {
    expect(
      await getPackageFiles(['/root/packages/a', '/root/packages/b']).toPromise()
    ).toEqual([
      '/root/packages/a/package.json',
      '/root/packages/b/package.json',
    ]);
  });
});
