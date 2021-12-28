import { execFile } from 'child_process';
import { defer } from 'rxjs';

export interface ChildProcessResponse {
  stderr: string;
  stdout: string;
};

export function execAsync(cmd: string, args?: string[]) {
  return defer(() => _execAsync(cmd, args));
}

export function _execAsync(
  cmd: string,
  args: string[] = []
): Promise<ChildProcessResponse> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        reject({ stdout, stderr });
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}
