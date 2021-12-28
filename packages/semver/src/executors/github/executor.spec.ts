import { of } from 'rxjs';

import { execAsync } from '../common/exec-async';
import executor from './executor';

import type { GithubExecutorSchema } from './schema';

jest.mock('../common/exec-async');

const options: GithubExecutorSchema = {
  tag: 'v1.0.0',
};

describe('@jscutlery/semver:github', () => {
  const mockExec = execAsync as jest.Mock;

  beforeEach(() => {
    mockExec.mockImplementation(() => {
      return of({
        stdout: 'success',
      });
    });
  });

  it('create release with specified --tag', async () => {
    const output = await executor(options);

    expect(mockExec).toBeCalledWith('gh release create', ['v1.0.0']);
    expect(output.success).toBe(true);
  });

  it('create release with specified --files', async () => {
    const output = await executor({ ...options, files: ['./dist/package'] });

    expect(mockExec).toBeCalledWith(
      'gh release create',
      expect.arrayContaining(['./dist/package'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --branch', async () => {
    const output = await executor({ ...options, branch: 'master' });

    expect(mockExec).toBeCalledWith(
      'gh release create',
      expect.arrayContaining(['--branch', 'master'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --notes', async () => {
    const output = await executor({ ...options, notes: 'add feature' });

    expect(mockExec).toBeCalledWith(
      'gh release create',
      expect.arrayContaining(['--notes', 'add feature'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --notesFile', async () => {
    const output = await executor({
      ...options,
      notesFile: 'libs/my-lib/CHANGELOG.md',
    });

    expect(mockExec).toBeCalledWith(
      'gh release create',
      expect.arrayContaining(['--notes-file', 'libs/my-lib/CHANGELOG.md'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --draft', async () => {
    const output = await executor({ ...options, draft: true });

    expect(mockExec).toBeCalledWith(
      'gh release create',
      expect.arrayContaining(['--draft'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --title', async () => {
    const output = await executor({ ...options, title: 'Title for release' });

    expect(mockExec).toBeCalledWith(
      'gh release create',
      expect.arrayContaining(['--title', 'Title for release'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --prerelease', async () => {
    const output = await executor({ ...options, prerelease: true });

    expect(mockExec).toBeCalledWith(
      'gh release create',
      expect.arrayContaining(['--prerelease'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --discussion-category', async () => {
    const output = await executor({
      ...options,
      discussionCategory: 'General',
    });

    expect(mockExec).toBeCalledWith(
      'gh release create',
      expect.arrayContaining(['--discussion-category', 'General'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --repo', async () => {
    const output = await executor({ ...options, repo: 'repo:MYORG/REPO' });

    expect(mockExec).toBeCalledWith(
      'gh release create',
      expect.arrayContaining(['--repo', 'repo:MYORG/REPO'])
    );
    expect(output.success).toBe(true);
  });
});
