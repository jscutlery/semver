import type { ProjectGraph } from '@nrwl/devkit';

export interface DevkitContract {
  createProjectGraphAsync(options: {
    exitOnError: boolean;
    resetDaemonClient: boolean;
  }): Promise<ProjectGraph>;
  cwd(): string;
  readFile(path: string, encoding: string): Promise<string>;
}
