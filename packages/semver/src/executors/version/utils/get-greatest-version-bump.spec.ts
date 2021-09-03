import { getGreatestVersionBump } from './get-greatest-version-bump';

describe('getGreatestVersionBump', () => {
  // This should only be used when we're calculating a version bump, which should only be release versions.
  describe('release versions', () => {
    it('returns a value when only one value is supplied in the array', () => {
      const version = getGreatestVersionBump(['0.0.1']);
      expect(version).toEqual('0.0.1');
    });

    it('returns the greatest value when the greatest is in the front of the list', () => {
      const version = getGreatestVersionBump(['1.0.0', '0.0.1', '0.1.0']);
      expect(version).toEqual('1.0.0');
    });

    it('returns the greatest value when the greatest is in the middle of the list', () => {
      const version = getGreatestVersionBump([
        '0.0.1',
        '0.1.0',
        '1.0.0',
        '0.0.1',
        '0.1.0',
      ]);
      expect(version).toEqual('1.0.0');
    });

    it('returns the greatest value when the greatest is at the end of the list', () => {
      const version = getGreatestVersionBump([
        '0.0.1',
        '0.0.1',
        '0.0.1',
        '0.0.1',
        '0.1.0',
      ]);
      expect(version).toEqual('0.1.0');
    });

    it("returns a value when there's no winner", () => {
      const version = getGreatestVersionBump([
        '0.0.1',
        '0.0.1',
        '0.0.1',
        '0.0.1',
      ]);
      expect(version).toEqual('0.0.1');
    });
  });
});
