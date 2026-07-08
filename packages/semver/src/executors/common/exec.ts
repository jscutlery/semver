import { execFile } from 'child_process';

export function exec(cmd: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const childProcess = execFile(cmd, args, (error, stdout, stderr) => {
      if (settled) {
        return;
      }
      settled = true;
      _removeEvents();

      if (error) {
        reject(new Error(stderr));
        return;
      }

      resolve(stdout);
    });

    const _removeEvents = _listenExitEvent(() => {
      if (settled) {
        return;
      }
      settled = true;
      _removeEvents();
      _killProcess(childProcess);
      resolve('');
    });
  });
}

function _killProcess(process: ReturnType<typeof execFile>): void {
  if (process.stdout) {
    process.stdout.removeAllListeners();
  }

  if (process.stderr) {
    process.stderr.removeAllListeners();
  }

  process.removeAllListeners();
  process.kill('SIGKILL');
}

function _listenExitEvent(
  fn: (signal: number) => void,
  events: NodeJS.Signals[] = ['SIGINT', 'SIGBREAK'],
): () => void {
  events.forEach((name) => process.on(name, fn));
  process.on('exit', fn);

  return () => {
    events.forEach((name) => process.off(name, fn));
    process.off('exit', fn);
  };
}
