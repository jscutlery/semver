import { readFile } from 'fs/promises';
import { cwd } from 'process';

export interface Devkit {
  cwd(): string;
  readFile(path: string): Promise<string>;
}

export class ConcreteDevkit implements Devkit {
  cwd(): string {
    return cwd();
  }

  readFile(path: string): Promise<string> {
    return readFile(path, 'utf-8');
  }
}

export const devkit = new ConcreteDevkit();
