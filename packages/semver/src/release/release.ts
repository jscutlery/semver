import { getConfig } from './config';
import { devkit } from './devkit';

export async function release(): Promise<void> {
  const config = await getConfig();
  const graph = await devkit.createGraph();
}
