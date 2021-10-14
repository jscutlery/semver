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
  if (versionTagPrefix !== undefined) {
    const resolvingContest = {
      target: projectName,
      projectName: projectName,
    };
    return resolveInterpolation(versionTagPrefix as string, resolvingContest) as string;
  }
  if (syncVersions) {
    return 'v';
  }
  return `${projectName}-`;
}
