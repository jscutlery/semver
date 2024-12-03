import {
  ExecutorContext,
  ProjectConfiguration,
  TargetConfiguration,
  readJsonFile,
  workspaceRoot,
  writeJsonFile,
} from '@nx/devkit';
import { execSync } from 'child_process';
import { promises, symlinkSync } from 'fs';
import { resolve } from 'path';
import * as tmp from 'tmp';

export interface TestingWorkspace {
  exec(command: string): void;
  runNx(command: string): void;
  generateLib(name: string, options?: string): void;
  installSemver(project: string, preset?: string): void;
  tearDown(): Promise<void>;
  root: string;
}

const packageManager = 'yarn';

function runNxNewCommand(dir: string) {
  execSync(
    `node ${require.resolve(
      'nx',
    )} new proj --nx-workspace-root=${dir} --no-interactive --skip-install --collection=@nx/workspace --npmScope=proj --preset=apps --e2eTestRunner=none --package-manager=${packageManager}`,
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
  execSync(`${packageManager} config set enableImmutableInstalls false`, {
    cwd: dir,
    stdio: 'inherit',
  });
  execSync(`${packageManager} install`, {
    cwd: dir,
    stdio: 'inherit',
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

  // This symlink is workaround for Nx trying to resolve its module locally when generating a new workspace
  symlinkSync(
    resolve(originalCwd, 'node_modules'),
    resolve(tmpRoot, 'node_modules'),
    'dir',
  );
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
      const commonArgs = `--unitTestRunner=none --linter=none --bundler=tsc --minimal --skipFormat`;
      this.runNx(
        `g @nx/js:lib --directory=libs/${name} ${commonArgs} ${options}`,
      );
    },

    installSemver(project: string, options = '') {
      this.runNx(
        `g @jscutlery/semver:install --projects=${project} --interactive=false ${options}`,
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
    nxJsonConfiguration: {},
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
