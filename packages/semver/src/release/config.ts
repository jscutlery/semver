import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { cwd } from 'process';

export async function getConfig() {
  try {
    const config = await readFile(resolve(cwd(), 'semver.json'), 'utf-8');
    return JSON.parse(config);
  } catch (error) {
    throw new Error('Could not find semver.json');
  }
}
