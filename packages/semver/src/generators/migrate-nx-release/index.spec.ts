import type {
  NxJsonConfiguration,
  ProjectConfiguration,
  Tree,
} from '@nx/devkit';
import {
  addProjectConfiguration,
  getProjects,
  logger,
  readNxJson,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import migrate from '.';
import { VersionBuilderSchema } from '../../executors/version/schema';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('Native Nx Release Migration', () => {
  let tree: Tree;
  let loggerInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
  });

  it('should bail out if sync mode is detected', () => {
    addProjectConfiguration(tree, 'a', {
      root: '.',
      targets: {
        version: {
          executor: '@jscutlery/semver:version',
          options: {
            syncVersions: true,
          },
        },
      },
    });

    migrate(tree, { skipFormat: true });

    const projectConfig = getProjects(tree).get('a');
    expect(projectConfig!.targets!.version).toBeDefined();
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'Sync mode detected, skipping migration. Please migrate your workspace manually.',
    );
  });

  it('should bail out if no semver config is detected', () => {
    addProjectConfiguration(tree, 'a', {
      root: '.',
      targets: {
        build: {
          executor: 'build',
        },
      },
    });

    migrate(tree, { skipFormat: true });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'No config detected, skipping migration.',
    );
    expect(readNxJson(tree)!.release).toBeUndefined();
  });

  it('should log if multiple semver configs are detected', () => {
    addProjectConfiguration(tree, 'a', {
      root: 'libs/a',
      targets: {
        version: {
          executor: '@jscutlery/semver:version',
          options: {
            commitMessageFormat: 'chore(release): {version}',
          },
        },
      },
    });
    addProjectConfiguration(tree, 'b', {
      root: 'libs/b',
      targets: {
        version: {
          executor: '@jscutlery/semver:version',
          options: {
            commitMessageFormat: 'release: {version}',
          },
        },
      },
    });

    migrate(tree, { skipFormat: true });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'Multiple semver configs detected, the migration can eventually break your workspace. Please verify the changes.',
    );
  });

  describe('Nx Release Configuration', () => {
    let release: NxJsonConfiguration['release'];

    function setupSemver(
      options: Partial<VersionBuilderSchema> = {},
      targets: ProjectConfiguration['targets'] = {},
    ) {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
            options,
          },
          ...targets,
        },
      });

      migrate(tree, { skipFormat: true });

      release = readNxJson(tree)!.release;
    }

    it('should configure release.releaseTagPattern', () => {
      setupSemver();

      expect(release!.releaseTagPattern).toBe(`{projectName}-{version}`);
    });

    it('should configure projects', () => {
      setupSemver();

      expect(release!.projects).toEqual(['a']);
      expect(release!.version!.conventionalCommits).toEqual(true);
      expect(release!.projectsRelationship).toEqual('independent');
    });

    it('should configure git with --skipCommit', () => {
      setupSemver({ skipCommit: true });

      expect(release).toEqual(
        expect.objectContaining({
          git: expect.objectContaining({
            commit: false,
          }),
        }),
      );
    });

    it('should configure github release', () => {
      setupSemver(
        { postTargets: ['github'] },
        { github: { executor: '@jscutlery/semver:github' } },
      );

      expect(release!.changelog).toEqual({
        automaticFromRef: true,
        projectChangelogs: { createRelease: 'github' },
      });
    });
  });

  describe('Cleanup @jscutlery/semver', () => {
    it('should remove version target', () => {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
          },
        },
      });

      migrate(tree, { skipFormat: true });

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig!.targets!.version).toBeUndefined();
    });

    it('should remove github post-target', () => {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
            options: {
              postTargets: ['build', 'github'],
            },
          },
          github: {
            executor: '@jscutlery/semver:github',
          },
          build: {
            command: 'exit 0',
          },
        },
      });

      migrate(tree, { skipFormat: true });

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig!.targets!.github).toBeUndefined();
    });

    it('should remove npm post-target (ngx-deploy-npm)', () => {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
            options: {
              postTargets: ['build', 'npm'],
            },
          },
          npm: {
            executor: 'ngx-deploy-npm:deploy',
          },
          build: {
            command: 'exit 0',
          },
        },
      });

      migrate(tree, { skipFormat: true });

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig!.targets!.npm).toBeUndefined();
      expect(projectConfig!.targets!.build).toBeDefined();
    });

    it('should remove npm post-target (custom npm publish command)', () => {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
            options: {
              postTargets: ['build', 'npm'],
            },
          },
          npm: {
            command: 'npm publish dist/libs/a',
          },
          build: {
            command: 'exit 0',
          },
        },
      });

      migrate(tree, { skipFormat: true });

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig!.targets!.npm).toBeUndefined();
      expect(projectConfig!.targets!.build).toBeDefined();
    });

    it('should keep build post-target', () => {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
            options: {
              postTargets: ['build'],
            },
          },
          build: {
            command: 'exit 0',
          },
        },
      });

      migrate(tree, { skipFormat: true });

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig!.targets!.build).toBeDefined();
    });

    it.todo('should remove @jscutlery/semver from package.json');
  });

  it.todo('should inform about detected ci setup and suggest how to update it');
});
