import type {
  NxJsonConfiguration,
  ProjectConfiguration,
  Tree,
} from '@nx/devkit';
import {
  addProjectConfiguration,
  getProjects,
  logger,
  readJson,
  readNxJson,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import migrate from '.';
import { VersionBuilderSchema } from '../../executors/version/schema';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('Nx Release Migration', () => {
  let tree: Tree;
  let loggerInfoSpy: jest.SpyInstance;

  const options = { skipFormat: true, skipInstall: false };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
    loggerInfoSpy.mockReset();
  });

  it('should bail out if sync mode is detected', async () => {
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

    await migrate(tree, options);

    const projectConfig = getProjects(tree).get('a');
    expect(projectConfig!.targets!.version).toBeDefined();
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'Sync mode detected, skipping migration. Please migrate your workspace manually.',
    );
  });

  it('should bail out if no semver config is detected', async () => {
    addProjectConfiguration(tree, 'a', {
      root: '.',
      targets: {
        build: {
          executor: 'build',
        },
      },
    });

    await migrate(tree, options);

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'No config detected, skipping migration.',
    );
    expect(readNxJson(tree)!.release).toBeUndefined();
  });

  it('should log if multiple semver configs are detected', async () => {
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

    await migrate(tree, options);

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'Multiple semver configs detected, the migration can eventually break your workspace. Please verify the changes.',
    );
  });

  describe('Nx Release Configuration', () => {
    let release: NxJsonConfiguration['release'];

    async function setupSemver(
      versionOpts: Partial<VersionBuilderSchema> = {},
      targets: ProjectConfiguration['targets'] = {},
    ) {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
            options: versionOpts,
          },
          ...targets,
        },
      });

      await migrate(tree, options);

      release = readNxJson(tree)!.release;
    }

    it('should configure release.releaseTagPattern', async () => {
      await setupSemver();

      expect(release!.releaseTagPattern).toBe(`{projectName}-{version}`);
    });

    it('should configure projects', async () => {
      await setupSemver();

      expect(release!.projects).toEqual(['a']);
      expect(release!.version!.conventionalCommits).toEqual(true);
      expect(release!.projectsRelationship).toEqual('independent');
    });

    it('should configure git with --skipCommit', async () => {
      await setupSemver({ skipCommit: true });

      expect(release).toEqual(
        expect.objectContaining({
          git: expect.objectContaining({
            commit: false,
          }),
        }),
      );
    });

    it('should configure github release', async () => {
      await setupSemver(
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
    it('should remove version target', async () => {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
          },
        },
      });

      await migrate(tree, options);

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig!.targets!.version).toBeUndefined();
    });

    it('should remove github post-target', async () => {
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

      await migrate(tree, options);

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig!.targets!.github).toBeUndefined();
    });

    it('should remove npm post-target (ngx-deploy-npm)', async () => {
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

      await migrate(tree, options);

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig!.targets!.npm).toBeUndefined();
      expect(projectConfig!.targets!.build).toBeDefined();
    });

    it('should remove npm post-target (custom npm publish command)', async () => {
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

      await migrate(tree, options);

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig!.targets!.npm).toBeUndefined();
      expect(projectConfig!.targets!.build).toBeDefined();
    });

    it('should keep build post-target', async () => {
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

      await migrate(tree, options);

      const projectConfig = getProjects(tree).get('a');
      expect(projectConfig!.targets!.build).toBeDefined();
    });

    it('should remove dependencies from package.json', async () => {
      tree.write(
        'package.json',
        JSON.stringify(
          {
            devDependencies: {
              '@jscutlery/semver': '0.0.0',
              'ngx-deploy-npm': '0.0.0',
            },
          },
          null,
          2,
        ),
      );

      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
          },
        },
      });

      await migrate(tree, options);

      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.devDependencies['@jscutlery/semver']).toBeUndefined();
      expect(packageJson.devDependencies['ngx-deploy-npm']).toBeUndefined();
    });

    it('should inform about CI setup if config detected', async () => {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
          },
        },
      });
      tree.write('.gitlab-ci.yml', '');

      await migrate(tree, options);

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'CI setup detected, please update your CI configuration to use Nx Release.',
      );
    });

    it('should remove targetDefaults', async () => {
      addProjectConfiguration(tree, 'a', {
        root: 'libs/a',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
          },
        },
      });

      tree.write(
        'nx.json',
        JSON.stringify(
          {
            targetDefaults: {
              version: {
                cache: false,
              },
              '@jscutlery/semver:version': {
                cache: false,
                options: {
                  commitMessageFormat: 'chore(release): {version}',
                },
              },
              npm: {
                command: 'npm publish dist/lib/a',
              },
            },
          },
          null,
          2,
        ),
      );

      await migrate(tree, options);

      const nxJson = readJson(tree, 'nx.json');
      expect(
        nxJson.targetDefaults['@jscutlery/semver:version'],
      ).toBeUndefined();
      expect(nxJson.targetDefaults.version).toBeUndefined();
      expect(nxJson.targetDefaults.npm).toBeUndefined();
    });
  });
});
