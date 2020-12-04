import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';

import { SemverSchematicSchema } from './schema';

describe('semver schematic', () => {
  let appTree: Tree;
  const options: SemverSchematicSchema = { name: 'test' };

  const testRunner = new SchematicTestRunner(
    '@jscutlery/semver',
    join(__dirname, '../../../collection.json')
  );

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
  });

  it('should run successfully', async () => {
    await expect(
      testRunner.runSchematicAsync('semver', options, appTree).toPromise()
    ).resolves.not.toThrowError();
  });
});
