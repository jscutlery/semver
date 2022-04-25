import { logger } from '@nrwl/devkit';
import { of, throwError } from 'rxjs';

import { exec } from '../common/exec';
import executor from './executor';

import type { GitLabReleaseSchema } from './schema';

jest.mock('../common/exec');

const options: GitLabReleaseSchema = {
  tag: 'v1.0.0',
};

describe('@jscutlery/semver:gitlab', () => {
  const mockExec = exec as jest.Mock;

  beforeEach(() => {
    mockExec.mockImplementation(() => {
      return of({
        stdout: 'success',
      });
    });
  });

  it('create release with specified --tag', async () => {
    const output = await executor(options);

    expect(mockExec).toBeCalledWith(
      'release-cli',
      expect.arrayContaining(['create', '--tag-name', 'v1.0.0'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --assets', async () => {
    const output = await executor({ ...options, assets: [{name: "asset1", url: "./dist/package"}] });

    expect(mockExec).toBeCalledWith(
      'release-cli',
      expect.arrayContaining(["--assets-link='{\"name\": \"asset1\", \"url\": \"./dist/package\"}'"])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --ref', async () => {
    const output = await executor({ ...options, ref: 'master' });

    expect(mockExec).toBeCalledWith(
      'release-cli',
      expect.arrayContaining(['--ref', 'master'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --description', async () => {
    const output = await executor({ ...options, description: 'add feature' });

    expect(mockExec).toBeCalledWith(
      'release-cli',
      expect.arrayContaining(['--description', 'add feature'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --name', async () => {
    const output = await executor({ ...options, name: 'Title for release' });

    expect(mockExec).toBeCalledWith(
      'release-cli',
      expect.arrayContaining(['--name', 'Title for release'])
    );
    expect(output.success).toBe(true);
  });


  it('create release with specified --milestones', async () => {
    const output = await executor({
      ...options,
      milestones: ["v1.0.0"],
    });

    expect(mockExec).toBeCalledWith(
      'release-cli',
      expect.arrayContaining(['--milestone', 'v1.0.0'])
    );
    expect(output.success).toBe(true);
  });

  it('create release with specified --releasedAt', async () => {
    const output = await executor({ ...options, releasedAt: 'XYZ' });

    expect(mockExec).toBeCalledWith(
      'release-cli',
      expect.arrayContaining(['--released-at', 'XYZ'])
    );
    expect(output.success).toBe(true);
  });

  it('handle release CLI errors', async () => {
    mockExec.mockImplementation(() => {
      return throwError(() => ({
        stderr: 'something went wrong'
      }));
    });
    jest.spyOn(logger, 'error').mockImplementation();

    const output = await executor(options);

    expect(logger.error).toBeCalled();
    expect(output.success).toBe(false);
  });
});
