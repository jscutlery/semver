import { generateFiles, joinPathFragments, Tree } from '@nx/devkit';

export function createChangelog(tree: Tree, libraryRoot: string) {
  if (tree.exists(joinPathFragments(libraryRoot, 'CHANGELOG.md'))) {
    return;
  }
  generateFiles(
    tree,
    joinPathFragments(__dirname, '../__files'), // path to the file templates
    libraryRoot,
    {},
  );
}
