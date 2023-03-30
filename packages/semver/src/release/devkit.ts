import { createProjectGraphAsync, ProjectGraph } from '@nrwl/devkit';
import { readFile } from 'fs/promises';
import { cwd } from 'process';

export interface Devkit {
  createGraph(): Promise<ProjectGraph>;
  cwd(): string;
  readFile(path: string): Promise<string>;
}

export class ConcreteDevkit implements Devkit {
  cwd(): string {
    return cwd();
  }

  createGraph(): Promise<ProjectGraph> {
    return createProjectGraphAsync({
      exitOnError: true,
      resetDaemonClient: false,
    });
  }

  readFile(path: string): Promise<string> {
    return readFile(path, 'utf-8');
  }
}

export const devkit = new ConcreteDevkit();
