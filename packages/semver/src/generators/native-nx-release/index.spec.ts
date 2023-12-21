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

    migrate(tree);

    const projectConfig = getProjects(tree).get('a');
    expect(projectConfig?.targets?.version).toBeDefined();
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'Sync mode detected, skipping migration. Please migrate your workspace manually.',
    );
  });

  it('should bail out if no semver config is detected', () => {
    addProjectConfiguration(tree, 'a', {
      root: '.',
      targets: {
        build: {
          executor: 'version',
        },
      },
    });

    migrate(tree);

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'No @jscutlery/semver config detected, skipping migration.',
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

      migrate(tree);

      release = readNxJson(tree)!.release;
    }

    it('should configure releaseTagPattern', () => {
      setupSemver();

      expect(release!.releaseTagPattern).toBe(`{projectName}-{version}`);
    });

    it('should configure changelog', () => {
      setupSemver();

      expect(release!.changelog).toEqual({
        git: {
          commit: true,
          tag: true,
        },
        workspaceChangelog: {
          createRelease: false,
          file: false,
        },
        projectChangelogs: true,
      });
    });

    it('should configure github release', () => {
      setupSemver(
        { postTargets: ['github'] },
        { github: { executor: '@jscutlery/semver:github' } },
      );

      expect(release!.changelog!.workspaceChangelog).toEqual({
        createRelease: 'github',
        file: false,
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

      migrate(tree);

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig?.targets?.version).toBeUndefined();
    });

    it('should remove post targets', () => {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
            options: {
              postTargets: ['npm', 'github'],
            },
          },
          npm: {
            command: 'exit 0',
          },
          github: {
            command: 'exit 0',
          },
        },
      });

      migrate(tree);

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig?.targets?.npm).toBeUndefined();
      expect(projectConfig?.targets?.github).toBeUndefined();
    });

    it.todo('should remove @jscutlery/semver from package.json');
  });

  it.todo('should inform about detected ci setup and suggest how to update it');
});
