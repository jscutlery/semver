import { generateFiles, joinPathFragments, Tree } from '@nx/devkit';

export function addChangelog(tree: Tree, libraryRoot: string) {
  generateFiles(
    tree,
    joinPathFragments(__dirname, '../__files'), // path to the file templates
    libraryRoot,
    {}
  );
}
