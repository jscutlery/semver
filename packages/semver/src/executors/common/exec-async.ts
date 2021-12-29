import { execFile } from 'child_process';
import { defer } from 'rxjs';

export interface ChildProcessResponse {
  stderr: string;
  stdout: string;
};

export function execAsync(cmd: string, args?: string[]) {
  return defer(() => _execFile(cmd, args));
}

export function _execFile(
  cmd: string,
  args: string[] = []
): Promise<ChildProcessResponse> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        reject({ stdout, stderr });
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}
