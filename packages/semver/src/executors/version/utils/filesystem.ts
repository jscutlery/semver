import * as fs from 'fs';

const fsPromises = fs.promises;

/* istanbul ignore next */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function readFile(filePath: string): Promise<string> {
  return fsPromises.readFile(filePath, { encoding: 'utf-8' });
}

export async function readFileIfExists(
  filePath: string,
  fallback = '',
): Promise<string> {
  return (await exists(filePath)) ? readFile(filePath) : fallback;
}

export async function readJsonFile(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath));
}

/* istanbul ignore next */
export function writeFile(
  filePath: string,
  data: Parameters<typeof fsPromises.writeFile>[1],
): Promise<void> {
  return fsPromises.writeFile(filePath, data, { encoding: 'utf-8' });
}
