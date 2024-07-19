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
  installPackagesTask,
  updateJson,
  NxJsonConfiguration,
  detectPackageManager,
} from '@nx/devkit';
import { VersionBuilderSchema } from '../../executors/version/schema';
import { defaultHeader } from '../../executors/version/utils/changelog';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

export default async function migrate(
  tree: Tree,
  options: { skipFormat: boolean; skipInstall: boolean },
) {
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
    logger.info('No config detected, skipping migration.');
    return;
  }

  const multipleSemverConfigsDetected =
    semverProjects
      .map(
        ([, projectConfig]) =>
          findVersionTarget(projectConfig) as [
            string,
            TargetConfiguration<VersionBuilderSchema>,
          ],
      )
      .every(
        ([, { options }], _, [[, { options: baseOptions }]]) =>
          JSON.stringify(options) === JSON.stringify(baseOptions),
      ) === false;

  if (multipleSemverConfigsDetected) {
    logger.info(
      'Multiple semver configs detected, the migration can eventually break your workspace. Please verify the changes.',
    );
  }

  configureNxRelease(tree, semverProjects);

  semverProjects.forEach(([projectName, projectConfig]) => {
    removeSemverTargets(tree, projectName, projectConfig);
    removeSemverChangelogHeader(tree, projectConfig);
  });

  updateJson<NxJsonConfiguration>(tree, 'nx.json', (nxJson) => {
    Object.entries(nxJson?.targetDefaults ?? {}).forEach(
      ([targetKey, target]) => {
        if (
          targetKey === 'version' ||
          targetKey.includes('semver') ||
          targetKey.includes('ngx-deploy-npm') ||
          /npm publish/.test(JSON.stringify(target))
        ) {
          delete nxJson!.targetDefaults![targetKey];
        }
      },
    );
    return nxJson;
  });

  updateJson(tree, 'package.json', (packageJson) => {
    ['@jscutlery/semver', 'ngx-deploy-npm'].forEach((dep) => {
      delete packageJson?.dependencies?.[dep];
      delete packageJson?.devDependencies?.[dep];
    });
    return packageJson;
  });

  if (
    tree.exists('.github') ||
    tree.exists('.gitlab-ci.yml') ||
    tree.exists('.circleci') ||
    tree.exists('.travis.yml')
  ) {
    logger.info(
      'CI setup detected, please update your CI configuration to use Nx Release.',
    );
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return () => {
    !options.skipInstall && installPackagesTask(tree);
  };
}

function removeSemverTargets(
  tree: Tree,
  projectName: string,
  projectConfig: ProjectConfiguration,
): void {
  logger.info(`[${projectName}] config detected, removing it.`);
  const [versionTarget, targetConfig] = findVersionTarget(projectConfig)!;
  const postTargets = (targetConfig.options?.postTargets ?? []).filter(
    (target) => {
      // Note: we are not using parseTargetString here as we need to pass the project graph, let's keep it simple.
      const targetName = target.includes(':') ? target.split(':')[1] : target;
      const executor = projectConfig.targets?.[targetName].executor;
      return (
        executor?.includes('semver') ||
        executor?.includes('ngx-deploy-npm') ||
        // Drop targets defined with both format:
        // { command: "npm publish" }
        // { executor: "nx:run-commands", options: { commands: "npm publish" } }
        /npm publish/.test(
          JSON.stringify(projectConfig.targets?.[targetName]),
        ) ||
        false
      );
    },
  );

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
    ({ executor }) => executor?.includes('semver:github') ?? false,
  );

  if (nxJson.release) {
    logger.info('Nx Release already configured, overwriting configuration.');
  }

  const pm = detectPackageManager(tree.root);
  const runCmd = pm === 'yarn' ? 'yarn' : pm === 'npm' ? 'npx' : 'pnpm exec';

  nxJson.release = {
    releaseTagPattern: `${tagPrefix}{version}`,
    projects: semverProjects.map(([projectName]) => projectName),
    projectsRelationship: 'independent',
    version: {
      preVersionCommand: `${runCmd} nx run-many -t build`,
      conventionalCommits: true,
    },
    git: {
      commit: options.skipCommit != true,
      ...(tree.exists('.husky') ? { commitArgs: '--no-verify' } : {}),
    },
    changelog: {
      automaticFromRef: true,
      projectChangelogs: {
        createRelease: githubRelease ? 'github' : false,
        ...(skipProjectChangelog ? { file: false } : {}),
      },
    },
  };

  writeJson(tree, 'nx.json', nxJson);
}

function findVersionTarget(
  projectConfig: ProjectConfiguration,
): [string, TargetConfiguration<VersionBuilderSchema>] | undefined {
  return Object.entries(projectConfig.targets ?? {}).find(
    ([, { executor }]) => executor?.includes('semver:version') ?? false,
  );
}

function getSemverOptions(
  projectConfig: ProjectConfiguration,
): Partial<VersionBuilderSchema> {
  return findVersionTarget(projectConfig)?.[1].options ?? {};
}

function removeSemverChangelogHeader(
  tree: Tree,
  projectConfig: ProjectConfiguration,
) {
  const changelog = projectConfig.root + '/CHANGELOG.md';
  if (tree.exists(changelog)) {
    const content = tree.read(changelog)!.toString('utf-8');
    tree.write(
      changelog,
      content.replace(
        getSemverOptions(projectConfig).changelogHeader ?? defaultHeader,
        '',
      ),
    );
  }
}
