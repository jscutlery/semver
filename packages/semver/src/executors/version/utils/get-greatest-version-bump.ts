import { rcompare } from 'semver';

export function getGreatestVersionBump(bumps: string[]) {
  return [...bumps].sort(rcompare)[0];
}
