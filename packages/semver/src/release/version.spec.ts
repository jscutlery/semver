import { exec } from './exec';
import { getCurrentVersion } from './version';

describe(getCurrentVersion.name, () => {
  beforeAll(async () => {
    await exec('mkdir', ['-p', '/tmp/semver']);
    await exec('git', ['init'], { cwd: '/tmp/semver' });
    await exec('git', ['config', 'user.email', 'test@email.com', '--local'], {
      cwd: '/tmp/semver',
    });
    await exec('git', ['config', 'user.name', 'test', '--local'], {
      cwd: '/tmp/semver',
    });
    await exec(
      'git',
      ['commit', '--allow-empty', '-m', 'init', '--no-gpg-sign'],
      { cwd: '/tmp/semver' }
    );
  });

  afterAll(async () => {
    await exec('rm', ['-rf', '/tmp/semver']);
  });

  beforeEach(() => {
    jest.spyOn(process, 'cwd').mockReturnValue('/tmp/semver');
  });

  describe('when no tags exist', () => {
    it('should return 0.0.0', async () => {
      expect(await getCurrentVersion({ tagPrefix: 'prefix-' })).toEqual(
        '0.0.0'
      );
    });
  });

  describe('when tags exist', () => {
    beforeAll(async () => {
      // Not matching the tagPrefix
      await exec('git', ['tag', 'cdk-1.0.0'], { cwd: '/tmp/semver' });
      await exec('git', ['tag', '2.0.0'], { cwd: '/tmp/semver' });
      // Outdated versions
      await exec('git', ['tag', 'template-0.1.0'], { cwd: '/tmp/semver' });
      await exec('git', ['tag', 'template-0.1.1'], { cwd: '/tmp/semver' });
      // Invalid versions
      await exec('git', ['tag', 'template-0.a.b'], { cwd: '/tmp/semver' });
      await exec('git', ['tag', 'template-2.0.0-'], { cwd: '/tmp/semver' });
      // Current version
      await exec('git', ['tag', 'template-1.0.0'], { cwd: '/tmp/semver' });
    });

    it('should return the current version', async () => {
      expect(await getCurrentVersion({ tagPrefix: 'template-' })).toEqual(
        '1.0.0'
      );
    });
  });
});
