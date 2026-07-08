import { exec } from '../../common/exec';
import { logStep } from './logger';

export async function verifyNpmAuth({
  projectName,
}: {
  projectName: string;
}): Promise<void> {
  try {
    await exec('npm', ['whoami']);
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
