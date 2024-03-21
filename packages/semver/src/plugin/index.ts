import {
  CreateNodes,
  ProjectConfiguration,
  TargetConfiguration,
  readJsonFile,
} from '@nx/devkit';
import { dirname, resolve } from 'path';

interface Options {
  buildTarget?: string;
  npmPublish?: boolean;
  githubRelease?: boolean;
  noVerify?: boolean;
  commitMessageFormat?: string;
}

export const createNodes: CreateNodes<Options> = [
  '**/package.json',
  (packageJsonPath, opts) => {
    opts ??= {};
    opts.buildTarget ??= 'build';
    opts.npmPublish ??= true;
    opts.githubRelease ??= true;

    const projectRoot = dirname(packageJsonPath);
    const projectConfig = readJsonFile<ProjectConfiguration>(
      resolve(projectRoot, 'project.json'),
    );
    const outputPath: string | undefined =
      projectConfig.targets?.[opts.buildTarget]?.options?.outputPath;

    if (!outputPath) {
      throw new Error(
        `The project "${projectRoot}" does not have a build target.`,
      );
    }

    const targets: [target: string, config: TargetConfiguration][] = [
      [
        'version',
        {
          executor: '@jscutlery/semver:version',
          options: {
            ...(opts.githubRelease ? { push: true } : {}),
            ...(opts.noVerify ? { noVerify: opts.noVerify } : {}),
            ...(opts.commitMessageFormat
              ? { commitMessageFormat: opts.commitMessageFormat }
              : {}),
            postTargets: [
              ...(opts.npmPublish ? [opts.buildTarget, 'npm'] : []),
              ...(opts.githubRelease ? ['github'] : []),
            ],
          },
        },
      ],
    ];

    if (opts.npmPublish) {
      targets.push([
        'npm',
        {
          command: `npm publish ${outputPath}`,
        },
      ]);
    }

    if (opts.githubRelease) {
      targets.push([
        'github',
        {
          executor: '@jscutlery/semver:github',
          options: {
            notes: '{notes}',
            tag: '{tag}',
          },
        },
      ]);
    }

    return {
      projects: {
        [projectRoot]: {
          targets: targets.reduce((acc, [target, config]) => {
            return { ...acc, [target]: config };
          }, {}),
        },
      },
    };
  },
];
