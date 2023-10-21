import { promises } from 'fs';
import { resolve } from 'path';
import * as tmp from 'tmp';
import {
  ExecutorContext,
  ProjectConfiguration,
  TargetConfiguration,
} from '@nx/devkit';
import { readJsonFile, workspaceRoot, writeJsonFile } from '@nx/devkit';
import { execSync } from 'child_process';

export interface TestingWorkspace {
  run(command: string): void;
  tearDown(): Promise<void>;
  root: string;
}

function runNxNewCommand(dir: string) {
  execSync(
    `node ${require.resolve(
      'nx',
    )} new proj --nx-workspace-root=${dir} --no-interactive --skip-install --collection=@nx/workspace --npmScope=proj --preset=apps`,
    {
      cwd: dir,
      stdio: 'ignore',
    },
  );
}

function linkPackage(dir: string) {
  const json = readJsonFile(resolve(dir, 'package.json'));
  json.devDependencies = {
    ...json.devDependencies,
    '@jscutlery/semver': `file:${resolve(
      workspaceRoot,
      'dist/packages/semver',
    )}`,
  };
  writeJsonFile(resolve(dir, 'package.json'), json);
}

function runInstall(dir: string) {
  execSync(`npm install`, {
    cwd: dir,
    stdio: 'ignore',
  });
}

export function setupTestingWorkspace(): TestingWorkspace {
  /* Create a temporary directory. */
  const tmpDir = tmp.dirSync();

  const originalCwd = process.cwd();
  process.chdir(tmpDir.name);

  const tmpRoot = process.cwd();
  const workspaceRoot = resolve(tmpRoot, 'proj');

  runNxNewCommand(tmpRoot);
  linkPackage(workspaceRoot);
  runInstall(workspaceRoot);

  return {
    /**
     * Run an Nx command in the workspace.
     */
    run(command: string) {
      execSync(`node ${require.resolve('nx')} ${command}`, {
        cwd: workspaceRoot,
        stdio: 'inherit',
      });
    },
    /**
     * Destroy and restore cwd.
     */
    async tearDown() {
      await promises.rm(tmpRoot, { recursive: true });
      process.chdir(originalCwd);
    },
    root: workspaceRoot,
  };
}

export function createFakeContext({
  cwd = process.cwd(),
  project,
  projectRoot,
  workspaceRoot,
  additionalProjects = [],
}: {
  cwd?: string;
  project: string;
  projectRoot: string;
  workspaceRoot: string;
  additionalProjects?: {
    project: string;
    projectRoot: string;
    targets?: Record<string, TargetConfiguration>;
  }[];
}): ExecutorContext {
  return {
    isVerbose: false,
    cwd: cwd,
    root: workspaceRoot,
    projectName: project,
    projectsConfigurations: {
      version: 2,
      projects: {
        [project]: {
          root: projectRoot,
          targets: {},
        },
        ...assembleAdditionalProjects(additionalProjects),
      },
    },
  } satisfies ExecutorContext;
}

function assembleAdditionalProjects(
  additionalProjects: {
    project: string;
    projectRoot: string;
    targets?: Record<string, TargetConfiguration>;
  }[],
) {
  return additionalProjects.reduce<{
    [projectName: string]: ProjectConfiguration;
  }>(
    (acc, p) => {
      acc[p.project] = {
        root: p.projectRoot,
        targets: p.targets || {},
      };
      return acc;
    },
    {} satisfies { [project: string]: ProjectConfiguration },
  );
}
