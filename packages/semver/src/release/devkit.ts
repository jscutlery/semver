import { ProjectGraph, createProjectGraphAsync } from '@nrwl/devkit';
import { readFile } from 'fs/promises';
import { cwd } from 'process';

/**
 * Devkit is a wrapper around Node.js APIs and Nx Workspace Graph to make them testable through contract testing.
 * It is used to abstract away the file system, the current working directory, and Nx workspace graph.
 */
export interface Devkit {
  cwd(): string;
  readFile(path: string): Promise<string>;
  createGraph(): Promise<ProjectGraph>;
}

export class ConcreteDevkit implements Devkit {
  cwd(): string {
    return cwd();
  }

  readFile(path: string): Promise<string> {
    return readFile(path, 'utf-8');
  }

  createGraph(): Promise<ProjectGraph> {
    return createProjectGraphAsync({
      exitOnError: true,
      resetDaemonClient: false,
    });
  }
}

export const devkit = new ConcreteDevkit();
