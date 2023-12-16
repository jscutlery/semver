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
  exec(command: string): void;
  runNx(command: string): void;
  generateLib(name: string, options?: string): void;
  installSemver(project: string, preset?: string): void;
  tearDown(): Promise<void>;
  root: string;
}

const packageManager = 'npm';

function runNxNewCommand(dir: string) {
  execSync(
    `node ${require.resolve(
      'nx',
    )} new proj --nx-workspace-root=${dir} --no-interactive --skip-install --collection=@nx/workspace --npmScope=proj --preset=apps --package-manager=${packageManager}`,
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
  execSync(`${packageManager} install`, {
    cwd: dir,
    stdio: 'ignore',
  });
}

function initGit(dir: string) {
  execSync(
    `
        git init --quiet

        # These are needed by CI.
        git config user.email "bot@jest.io"
        git config user.name "Test Bot"
        git config commit.gpgsign false
`,
    { cwd: dir, stdio: 'ignore' },
  );
}

export function setupTestingWorkspace(): TestingWorkspace {
  /* Create a temporary directory. */
  const tmpDir = tmp.dirSync();

  const originalCwd = process.cwd();
  process.chdir(tmpDir.name);

  const tmpRoot = process.cwd();
  const workspaceRoot = resolve(tmpRoot, 'proj');

  runNxNewCommand(tmpRoot);
  initGit(workspaceRoot);
  linkPackage(workspaceRoot);
  runInstall(workspaceRoot);

  return {
    runNx(command: string) {
      execSync(`node ${require.resolve('nx')} ${command}`, {
        cwd: workspaceRoot,
        stdio: 'inherit',
      });
    },

    exec(command: string) {
      execSync(command, {
        cwd: workspaceRoot,
        stdio: 'inherit',
      });
    },

    generateLib(name: string, options = '') {
      const commonArgs = `--directory=libs --unitTestRunner=none --linter=none --bundler=none --minimal --skipFormat`;
      this.runNx(`g @nx/js:lib ${name} ${commonArgs} ${options}`);
    },

    installSemver(project: string, options = '') {
      this.runNx(
        `g @jscutlery/semver:install --projects=${project} ${options}`,
      );
    },

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
  targets = {},
  additionalProjects = [],
}: {
  cwd?: string;
  project: string;
  projectRoot: string;
  workspaceRoot: string;
  targets?: Record<string, TargetConfiguration>;
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
          targets,
        },
        ...assembleAdditionalProjects(additionalProjects),
      },
    },
    projectGraph: {
      nodes: {},
      dependencies: {},
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
