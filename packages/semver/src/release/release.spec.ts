import * as fs from 'fs/promises';
import { vol } from 'memfs';
import { release } from './release';

jest.mock('process', () => ({ cwd: () => '/tmp' }));
jest.mock('fs/promises', () => jest.requireActual('memfs').fs.promises);

describe(release.name, () => {
  afterEach(() => {
    vol.reset();
  });

  describe('when semver.json does not exist or is invalid', () => {
    it('should throw an error when not defined', async () => {
      await expect(release()).rejects.toThrow('Could not find semver.json');
    });

    it('should throw an error when invalid', async () => {
      vol.fromJSON(
        {
          './semver.json': JSON.stringify({}),
        },
        '/tmp'
      );
      await expect(release()).rejects.toThrow('Invalid semver.json');
    });
  });

  describe('when semver.json exists', () => {
    beforeEach(() => {
      vol.fromJSON(
        {
          './semver.json': JSON.stringify({
            packages: [
              { name: 'semver', type: 'independent', path: 'packages/semver' },
            ],
          }),
        },
        '/tmp'
      );
    });

    it('should read config', async () => {
      const spy = jest.spyOn(fs, 'readFile');
      await release();
      expect(spy).toHaveBeenCalledWith('/tmp/semver.json', 'utf-8');
      spy.mockClear();
    });
  });
});
