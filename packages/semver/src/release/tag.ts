import { exec } from './exec';

export async function getTags(): Promise<string[]> {
  return (await exec('git', ['tag', '--list'])).trim().split('\n');
}
