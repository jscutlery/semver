import { resolveInterpolation } from './resolve-interpolation';

export function formatTagPrefix({
  versionTagPrefix,
  projectName,
  syncVersions,
}: {
  versionTagPrefix: string | null | undefined;
  projectName: string;
  syncVersions: boolean;
}): string {
  if (versionTagPrefix !== undefined) {
    return resolveInterpolation(versionTagPrefix as string, {
      target: projectName,
      projectName: projectName,
    }) as string;
  }

  if (syncVersions) {
    return 'v';
  }

  return `${projectName}-`;
}

export function formatTag({
  tagPrefix,
  version,
}: {
  tagPrefix: string;
  version: string;
}): string {
  return `${tagPrefix}${version}`;
}
