import {
  getProjects,
  updateProjectConfiguration,
  type Tree,
  logger,
} from '@nx/devkit';

export default function migrate(tree: Tree) {
  const projects = Array.from(getProjects(tree));
  const syncModeDetected = projects.some(([, projectConfig]) => {
    return projectConfig.targets?.version?.options?.syncVersions === true;
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

  semverProjects.forEach(([projectName, projectConfig]) => {
    logger.info(
      `Updating project "${projectName}", removing "version" target.`,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-non-null-assertion
    const { version, ...targets } = projectConfig.targets!;
    const postTargets = (version?.options?.postTargets as string[]) ?? [];

    if (postTargets.length > 0) {
      logger.info(
        `Updating project "${projectName}", removing post targets: "${postTargets.join(
          '", "',
        )}"`,
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
  });
}
