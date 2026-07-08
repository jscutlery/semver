import { catchError, map, type Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { exec } from '../../common/exec';
import { logStep } from './logger';

export function verifyNpmAuth({
  projectName,
}: {
  projectName: string;
}): Observable<void> {
  return exec('npm', ['whoami']).pipe(
    map(() => undefined),
    catchError(() =>
      throwError(
        () =>
          new Error(
            'Failed to authenticate with the npm registry. Run "npm login" or check your NPM_TOKEN, then try again.',
          ),
      ),
    ),
    logStep({
      step: 'npm_auth_success',
      message: 'Verified npm registry authentication.',
      projectName,
    }),
  );
}
