import { resolveInterpolation } from '../utils/resolve-interpolation';

export function resolveTagPrefix({
  versionTagPrefix,
  projectName,
  syncVersions,
}: {
  versionTagPrefix: string | null | undefined;
  projectName: string;
  syncVersions: boolean;
}): string {
  if (versionTagPrefix !== undefined && versionTagPrefix !== null) {
    const resolvingContest = {
      target: projectName,
      projectName: projectName,
    };
    return resolveInterpolation(versionTagPrefix, resolvingContest) as string;
  }
  if (syncVersions) {
    return 'v';
  }
  return `${projectName}-`;
}
