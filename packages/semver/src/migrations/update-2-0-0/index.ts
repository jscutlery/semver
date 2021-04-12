import { Rule } from '@angular-devkit/schematics';
import { updateWorkspace } from '@nrwl/workspace';

export default function (): Rule {
  return () => {
    return updateWorkspace((workspace) => {
      workspace.projects.forEach((project) => {
        if (project.targets.has('version')) {
          const options = project.targets.get('version').options ?? {};

          /* Check if the outdated option is defined. */
          if (typeof options.rootChangelog === 'boolean') {
            const newOptions = {
              skipRootChangelog: !options.rootChangelog,
            };

            /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
            const { rootChangelog, ...otherOptions } = options;
            /* For a mysterious reason, to override the builder definition we have to delete it before. */
            project.targets.delete('version');
            project.targets.set('version', {
              builder: '@jscutlery/semver',
              options: { ...otherOptions, ...newOptions },
            });
          }
        }
      });
    });
  };
}
