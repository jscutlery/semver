import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { SchemaOptions } from '../schema';

export function addDependencies(options: SchemaOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    console.log('options', options, tree, context);
  };
}


