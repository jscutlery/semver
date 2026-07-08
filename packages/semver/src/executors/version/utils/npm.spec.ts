import { readTargetOptions, runExecutor } from '@nx/devkit';
import * as cp from '../../common/exec';
import { readJsonFile, writeFile } from './filesystem';
import { verifyNpmAuth } from './npm';
import { createFakeContext } from '../testing';

jest.mock('../../common/exec');
jest.mock('./filesystem');
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  runExecutor: jest.fn(),
  readTargetOptions: jest.fn(),
}));

jest.spyOn(console, 'log').mockImplementation();

describe(verifyNpmAuth.name, () => {
  const mockRunExecutor = runExecutor as jest.Mock;
  const mockReadTargetOptions = readTargetOptions as jest.Mock;
  const mockReadJsonFile = readJsonFile as jest.MockedFunction<
    typeof readJsonFile
  >;
  const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;

  const context = createFakeContext({
    project: 'p',
    projectRoot: 'packages/p',
    workspaceRoot: '/root',
    targets: {
      build: {
        executor: '@nx/js:tsc',
        options: {
          outputPath: 'dist/packages/p',
        },
      },
    },
  });

  beforeEach(() => {
    mockRunExecutor.mockImplementation(function* () {
      yield { success: true };
    });
    mockReadTargetOptions.mockReturnValue({
      outputPath: 'dist/packages/p',
    });
    mockReadJsonFile.mockResolvedValue({ version: '1.0.0' });
    mockWriteFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should build then publish a dry-run to verify authentication', async () => {
    jest.spyOn(cp, 'exec').mockResolvedValue('');

    await verifyNpmAuth({ context, projectName: 'p' });

    expect(mockRunExecutor).toHaveBeenCalledWith(
      expect.objectContaining({ project: 'p', target: 'build' }),
      {},
      context,
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/root/dist/packages/p/package.json',
      JSON.stringify({ version: '1.0.0-verify.0' }, null, 2).concat('\n'),
    );
    expect(cp.exec).toHaveBeenCalledWith('npm', [
      'publish',
      '--dry-run',
      '--access',
      'public',
      '--tag',
      'verify',
      '/root/dist/packages/p',
    ]);
  });

  it('should throw a descriptive error when the build fails', async () => {
    mockRunExecutor.mockImplementation(function* () {
      yield { success: false };
    });

    await expect(verifyNpmAuth({ context, projectName: 'p' })).rejects.toThrow(
      /Failed to authenticate with the npm registry/,
    );

    expect(cp.exec).not.toHaveBeenCalled();
  });

  it('should throw a descriptive error when the dry-run publish fails', async () => {
    jest.spyOn(cp, 'exec').mockRejectedValue(new Error('ENEEDAUTH'));

    await expect(verifyNpmAuth({ context, projectName: 'p' })).rejects.toThrow(
      /Failed to authenticate with the npm registry/,
    );
  });
});
