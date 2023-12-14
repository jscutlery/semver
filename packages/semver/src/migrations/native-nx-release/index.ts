import { getProjects, updateProjectConfiguration, type Tree, logger } from '@nx/devkit';

export default function migrate(tree: Tree) {
  Array.from(getProjects(tree)).filter(([, projectConfig]) => {
    return projectConfig.targets?.version?.executor === '@jscutlery/semver:version'
  }).forEach(([projectName, projectConfig]) => {
    logger.info(`Updating project "${projectName}", removing version target.`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-non-null-assertion
    const { version, ...targets } = projectConfig.targets!;
    const newProjectConfig = {
      ...projectConfig,
      targets,
    };
    updateProjectConfiguration(tree, projectName, newProjectConfig);
  });
}
