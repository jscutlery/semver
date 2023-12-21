import {
  getProjects,
  updateProjectConfiguration,
  type Tree,
  logger,
  ProjectConfiguration,
  readNxJson,
  formatFiles,
  writeJson,
} from '@nx/devkit';
import { VersionBuilderSchema } from '../../executors/version/schema';

export default function migrate(tree: Tree) {
  const projects = Array.from(getProjects(tree));
  const syncModeDetected = projects.some(([, projectConfig]) => {
    return getSemverOptions(projectConfig).syncVersions === true;
  });

  if (syncModeDetected) {
    logger.info(
      'Sync mode detected, skipping migration. Please migrate your workspace manually.',
    );
    return;
  }

  const semverProjects = projects.filter(([, projectConfig]) => {
    return (
      projectConfig.targets?.version?.executor === '@jscutlery/semver:version'
    );
  });

  if (semverProjects.length === 0) {
    logger.info('No @jscutlery/semver config detected, skipping migration.');
    return;
  }

  configureNxRelease(tree, semverProjects);

  semverProjects.forEach(([projectName, projectConfig]) => {
    removeSemverTargets(projectName, projectConfig, tree);
  });

  return () => formatFiles(tree);
}

function removeSemverTargets(
  projectName: string,
  projectConfig: ProjectConfiguration,
  tree: Tree,
): void {
  logger.info(
    `[${projectName}] @jscutlery/semver config detected, removing it.`,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-non-null-assertion
  const { version, ...targets } = projectConfig.targets!;
  const postTargets = (version?.options?.postTargets as string[]) ?? [];

  if (postTargets.length > 0) {
    logger.info(
      `[${projectName}] Post-targets detected, removing: "${postTargets.join(
        '", "',
      )}".`,
    );
  }

  postTargets.forEach((postTarget) => {
    delete targets[postTarget];
  });

  const newProjectConfig = {
    ...projectConfig,
    targets,
  };

  updateProjectConfiguration(tree, projectName, newProjectConfig);
}

function configureNxRelease(
  tree: Tree,
  semverProjects: [string, ProjectConfiguration][],
): void {
  const nxJson = readNxJson(tree);

  if (nxJson == null) {
    logger.info('No nx.json detected, skipping Nx Release configuration.');
    return;
  }

  logger.info('Configuring Nx Release.');

  // We assume that all projects have the same configuration, so we only take the first one.
  const [, projectConfig] = semverProjects[0];
  const options = getSemverOptions(projectConfig);
  const tagPrefix = options.tagPrefix ?? '{projectName}-';
  const skipProjectChangelog = options.skipProjectChangelog ?? false;
  const githubRelease = Object.values(projectConfig.targets!).some(
    (target) => target.executor === '@jscutlery/semver:github',
  );

  nxJson.release ??= {
    releaseTagPattern: `${tagPrefix}{version}`,
    changelog: {
      git: {
        commit: true,
        tag: true,
      },
      workspaceChangelog: {
        createRelease: githubRelease ? 'github' : false,
        file: false,
      },
      projectChangelogs: !skipProjectChangelog,
    },
  };

  writeJson(tree, 'nx.json', nxJson);
}

function getSemverOptions(
  projectConfig: ProjectConfiguration,
): VersionBuilderSchema {
  return projectConfig.targets?.version?.options ?? {};
}

// "release": {
//   "releaseTagPattern": "{version}",
//   "changelog": {
//     "git": {
//       "commit": true,
//       "tag": true
//     },
//     "workspaceChangelog": {
//       "createRelease": "github",
//       "file": false
//     },
//     "projectChangelogs": true
//   },
//   "groups": {
//     "npm": {
//       "projects": ["rxjs"],
//       "version": {
//         "generatorOptions": {
//           "currentVersionResolver": "git-tag",
//           "specifierSource": "conventional-commits"
//         }
//       }
//     }
//   }
// }
