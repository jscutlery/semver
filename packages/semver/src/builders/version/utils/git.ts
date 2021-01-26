import { Observable } from 'rxjs';

/**
 * @deprecated 🚧 Work in progress.
 */
export function getCommits(args: {
  projectRoot: string;
  since: string;
}): Observable<string[]> {
  throw new Error('🚧 work in progress!');
}
