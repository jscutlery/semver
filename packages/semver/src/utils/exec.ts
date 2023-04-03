import { execFile } from 'child_process';
import { cwd as _cwd } from 'process';

export function exec(
  command: string,
  args: string[],
  { cwd = _cwd() }: { cwd?: string } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      if (stderr) {
        reject(stderr);
      }
      resolve(stdout);
    });
  });
}
