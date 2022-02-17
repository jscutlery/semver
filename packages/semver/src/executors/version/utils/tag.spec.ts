import { formatTagPrefix } from './tag';

describe(formatTagPrefix.name, () => {
  it('should resolve interpolated string', () => {
    expect(
      formatTagPrefix({
        versionTagPrefix: 'testtagPrefix',
        projectName: 'testProjectName',
        syncVersions: true,
      })
    ).toBe('testtagPrefix');
  });

  it('should resolve syncVersions', () => {
    expect(
      formatTagPrefix({
        versionTagPrefix: undefined,
        projectName: 'testProjectName',
        syncVersions: true,
      })
    ).toBe('v');
  });

  it('should resolve default tag', () => {
    expect(
      formatTagPrefix({
        versionTagPrefix: undefined,
        projectName: 'testProjectName',
        syncVersions: false,
      })
    ).toBe('testProjectName-');
  });
});
