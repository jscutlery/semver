import { Observable } from 'rxjs';

function tryBump({
  projectRoot,
  tagPrefix,
}: {
  projectRoot: string;
  tagPrefix: string;
}): Observable<string> {
  throw new Error('🚧 work in progress!');
}

describe('tryBump', () => {
  xit('🚧 should compute next version based on current version and changes', async () => {
    // @todo mock getCommits with some commits
    const newVersion = await tryBump({
      projectRoot: '/libs/demo',
      tagPrefix: 'demo-',
    }).toPromise();
    expect(newVersion).toEqual('2.2.0');
    // @todo check getCommits call
  });

  xit('🚧 should return null if there are no changes in current path', async () => {
    // @todo mock getCommits with no commits
    const newVersion = await tryBump({
      projectRoot: '/libs/demo',
      tagPrefix: 'demo-',
    }).toPromise();
    expect(newVersion).toBe(null);
    // @todo check getCommits call
  });
});
