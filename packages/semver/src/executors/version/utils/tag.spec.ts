import { resolveTagPrefix } from './tag';

describe(resolveTagPrefix.name, () => {
  it('should resolve interpolated string', () => {
    expect(
      resolveTagPrefix({
        versionTagPrefix: 'testVersionTagPrefix',
        projectName: 'testProjectName',
        syncVersions: true,
      })
    ).toBe('testVersionTagPrefix');
  });

  it('should resolve syncVersions', () => {
    expect(
      resolveTagPrefix({
        versionTagPrefix: undefined,
        projectName: 'testProjectName',
        syncVersions: true,
      })
    ).toBe('v');
  });

  it('should resolve default tag', () => {
    expect(
      resolveTagPrefix({
        versionTagPrefix: undefined,
        projectName: 'testProjectName',
        syncVersions: false,
      })
    ).toBe('testProjectName-');
  });
});
