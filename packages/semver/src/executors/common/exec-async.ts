import { exec, ExecException } from 'child_process';
import { defer } from 'rxjs';

export type ChildProcessResponse = { error?: ExecException | null, stderr: string; stdout: string };

export function execAsync(cmd: string, args?: string[]) {
  return defer(() => _execAsync(cmd, args));
}

export function _execAsync(cmd: string, args: string[] = []): Promise<ChildProcessResponse> {
  return new Promise((resolve, reject) => {
    exec(
      `${cmd} ${args.length > 0 ? args.join(' '): ''}`.trim(),
      { cwd: process.cwd() },
      (error, stdout, stderr) => {
        if (error) {
          reject({ error, stdout, stderr });
          return;
        }

        resolve({ stdout, stderr });
      }
    );
  });
}
