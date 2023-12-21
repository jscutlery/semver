import {
  getProjects,
  updateProjectConfiguration,
  type Tree,
  logger,
  ProjectConfiguration,
  readNxJson,
  formatFiles,
  writeJson,
  TargetConfiguration,
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

  const semverProjects = projects.filter(
    ([, projectConfig]) => findVersionTarget(projectConfig) !== undefined,
  );

  if (semverProjects.length === 0) {
    logger.info('No @jscutlery/semver config detected, skipping migration.');
    return;
  }

  configureNxRelease(tree, semverProjects);

  semverProjects.forEach(([projectName, projectConfig]) => {
    removeSemverTargets(tree, projectName, projectConfig);
  });

  return () => formatFiles(tree);
}

function removeSemverTargets(
  tree: Tree,
  projectName: string,
  projectConfig: ProjectConfiguration,
): void {
  logger.info(
    `[${projectName}] @jscutlery/semver config detected, removing it.`,
  );
  const [versionTarget, targetConfig] = findVersionTarget(projectConfig)!;
  const postTargets = targetConfig.options?.postTargets ?? [];

  if (postTargets.length > 0) {
    logger.info(
      `[${projectName}] Post-targets detected, removing: "${postTargets.join(
        '", "',
      )}".`,
    );
  }

  [versionTarget, ...postTargets].forEach((target) => {
    delete projectConfig.targets![target];
  });

  updateProjectConfiguration(tree, projectName, projectConfig);
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
  const [, semverConfig] = semverProjects[0];
  const options = getSemverOptions(semverConfig);
  const tagPrefix = options.tagPrefix ?? '{projectName}-';
  const skipProjectChangelog = options.skipProjectChangelog ?? false;
  const githubRelease = Object.values(semverConfig.targets!).some(
    (target) => target.executor === '@jscutlery/semver:github',
  );

  nxJson.release ??= {
    releaseTagPattern: `${tagPrefix}{version}`,
    changelog: {
      git: {
        commit: !options.skipCommit ?? true,
        ...(options.commitMessageFormat
          ? { commitMessage: options.commitMessageFormat }
          : {}),
        tag: true,
      },
      workspaceChangelog: {
        createRelease: githubRelease ? 'github' : false,
        file: false,
      },
      projectChangelogs: !skipProjectChangelog,
    },
    groups: {
      npm: {
        projects: semverProjects.map(([projectName]) => projectName),
        projectsRelationship: 'independent',
        version: {
          generatorOptions: {
            currentVersionResolver: 'git-tag',
            specifierSource: 'conventional-commits',
          },
        },
      },
    },
  };

  writeJson(tree, 'nx.json', nxJson);
}

function findVersionTarget(
  projectConfig: ProjectConfiguration,
): [string, TargetConfiguration<VersionBuilderSchema>] | undefined {
  return Object.entries(projectConfig.targets ?? {}).find(
    ([, targetOptions]) =>
      targetOptions.executor === '@jscutlery/semver:version',
  );
}

function getSemverOptions(
  projectConfig: ProjectConfiguration,
): Partial<VersionBuilderSchema> {
  return findVersionTarget(projectConfig)?.[1].options ?? {};
}
