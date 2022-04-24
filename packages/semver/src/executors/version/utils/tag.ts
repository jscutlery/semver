import { createTemplateString } from './template-string';

export function formatTagPrefix({
  versionTagPrefix,
  projectName,
  syncVersions,
}: {
  versionTagPrefix: string | null | undefined;
  projectName: string;
  syncVersions: boolean;
}): string {
  if (versionTagPrefix != null) {
    return createTemplateString(versionTagPrefix, {
      target: projectName,
      projectName: projectName,
    });
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
