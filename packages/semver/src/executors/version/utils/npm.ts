import type { ExecutorContext } from '@nx/devkit';
import { parseTargetString, readTargetOptions, runExecutor } from '@nx/devkit';
import { resolve } from 'path';
import { exec } from '../../common/exec';
import { readJsonFile, writeFile } from './filesystem';
import { logStep } from './logger';

/**
 * Verify npm registry authentication by building the package and running a
 * dry-run publish. A plain "npm whoami" doesn't work with OIDC-based
 * Trusted Publishing, since no token is exchanged until an actual publish
 * is attempted.
 */
export async function verifyNpmAuth({
  context,
  projectName,
}: {
  context: ExecutorContext;
  projectName: string;
}): Promise<void> {
  try {
    const distFolderPath = await _buildAndBumpVerifyVersion({
      context,
      projectName,
    });

    await exec('npm', [
      'publish',
      '--dry-run',
      '--access',
      'public',
      '--tag',
      'verify',
      distFolderPath,
    ]);
  } catch {
    throw new Error(
      'Failed to authenticate with the npm registry. Run "npm login" or check your NPM_TOKEN, then try again.',
    );
  }

  logStep({
    step: 'npm_auth_success',
    message: 'Verified npm registry authentication.',
    projectName,
  });
}

async function _buildAndBumpVerifyVersion({
  context,
  projectName,
}: {
  context: ExecutorContext;
  projectName: string;
}): Promise<string> {
  const target = parseTargetString(`${projectName}:build`, context);
  const { outputPath } = readTargetOptions<{ outputPath: string }>(
    target,
    context,
  );

  for await (const { success } of await runExecutor(target, {}, context)) {
    if (!success) {
      throw new Error(`Failed to build "${projectName}".`);
    }
  }

  const distFolderPath = resolve(context.root, outputPath);
  const packageJsonPath = resolve(distFolderPath, 'package.json');
  const packageJson = (await readJsonFile(packageJsonPath)) as {
    version: string;
  };

  await writeFile(
    packageJsonPath,
    JSON.stringify(
      { ...packageJson, version: `${packageJson.version}-verify.0` },
      null,
      2,
    ).concat('\n'),
  );

  return distFolderPath;
}
