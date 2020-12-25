import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace, runSchematic } from '@nrwl/workspace/testing';
import * as path from 'path';

import { SchemaOptions } from './schema';
import { readJsonInTree } from './testing';

const collectionPath = path.join(__dirname, '../../../collection.json');

const libOptions = { name: 'lib' };

const options: SchemaOptions = {
  syncVersions: false,
  branch: 'main',
  remote: 'origin',
  push: true,
};

describe('ng-add schematic', () => {
  let appTree: Tree;

  let schematicRunner: SchematicTestRunner;

  beforeEach(async () => {
    schematicRunner = new SchematicTestRunner(
      '@jscutlery/semver',
      collectionPath
    );

    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    appTree = await runSchematic('lib', libOptions, appTree);
  });

  it('should add proper package to dev dependencies', async () => {
    const tree = await schematicRunner
      .runSchematicAsync('ng-add', options, appTree)
      .toPromise();

    const packageJson = readJsonInTree(tree, 'package.json');

    expect(packageJson.dependencies['@jscutlery/semver']).toBeUndefined();
    expect(packageJson.devDependencies['@jscutlery/semver']).toBeDefined();
  });

  xit('should configure semver for multiple projects', async () => {
    // @todo
  });
});
