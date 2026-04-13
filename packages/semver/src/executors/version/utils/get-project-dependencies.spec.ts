import { ExecutorContext, type ProjectGraph } from '@nx/devkit';
import {
  getDependencyRootsFromProjectNames,
  getDependencyRoots,
  getProjectDependencies,
  getProjectVersionBuilderSchema,
  getProjectVersionBuilderSchemaFromContext,
} from './get-project-dependencies';

// Mock @nx/devkit at the top level for dynamic import support
const mockCreateProjectGraphAsync = jest.fn();
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  createProjectGraphAsync: mockCreateProjectGraphAsync,
}));
jest.mock('@nx/workspace/src/core/project-graph', () => ({}));

const projectGraph: ProjectGraph = {
  nodes: {},
  dependencies: {
    demo: [
      {
        type: 'static',
        source: 'demo',
        target: 'npm:@mock/npm-lib1',
      },
      {
        type: 'implicit',
        source: 'demo',
        target: 'lib1',
      },
      {
        type: 'static',
        source: 'demo',
        target: 'lib2',
      },
    ],
    lib1: [
      {
        type: 'static',
        source: 'lib1',
        target: 'npm:@mock/npm-lib1',
      },
      {
        type: 'implicit',
        source: 'lib1',
        target: 'lib2',
      },
    ],
    lib2: [
      {
        type: 'static',
        source: 'lib2',
        target: 'npm:@mock/npm-lib2',
      },
      {
        type: 'static',
        source: 'lib2',
        target: 'lib1',
      },
      {
        type: 'static',
        source: 'lib2',
        target: 'lib3',
      },
    ],
    lib3: [],
    'demo-e2e': [
      {
        type: 'implicit',
        source: 'demo-e2e',
        target: 'demo',
      },
    ],
  },
};

const context: ExecutorContext = {
  root: '',
  cwd: '',
  isVerbose: false,
  nxJsonConfiguration: {},
  projectGraph,
  projectsConfigurations: {
    version: 0,
    projects: {
      demo: {
        root: 'apps/demo',
        targets: {
          versionAlias: {
            executor: '@jscutlery/semver:version',
            options: {
              tagPrefix: '{projectName}@',
            },
          },
        },
      },
      lib1: {
        root: 'libs/lib1',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
            options: {
              tagPrefix: '{projectName}@v',
            },
          },
        },
      },
      lib2: {
        root: 'libs/lib2',
        targets: {
          release: {
            executor: '@jscutlery/semver:version',
            options: {
              tagPrefix: '{projectName}@v',
            },
          },
        },
      },
      lib3: {
        root: 'libs/lib3',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
            options: {
              tagPrefix: '{projectName}@v',
            },
          },
        },
      },
      'demo-e2e': {
        root: 'apps/demo-e2e',
        targets: {
          version: {
            executor: '@jscutlery/semver:version',
            options: {
              tagPrefix: '{projectName}@',
            },
          },
        },
      },
    },
  },
} as const;

describe('projectDependencies', () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreateProjectGraphAsync.mockReset();
  });

  it('returns a list of libs that the project is dependent on', async () => {
    mockCreateProjectGraphAsync.mockReturnValue(Promise.resolve(projectGraph));

    const dependencies = await getProjectDependencies('demo');
    expect(dependencies).toEqual(['lib1', 'lib2']);

    expect(mockCreateProjectGraphAsync).toHaveBeenCalledTimes(1);
  });

  it('returns a sub-dependency', async () => {
    mockCreateProjectGraphAsync.mockReturnValue(Promise.resolve(projectGraph));

    const dependencies = await getProjectDependencies('lib1');
    expect(dependencies).toEqual(['lib2']);

    expect(mockCreateProjectGraphAsync).toHaveBeenCalledTimes(1);
  });

  it('handles a failure in retrieving the dependency graph', async () => {
    mockCreateProjectGraphAsync.mockRejectedValue('thrown error');

    let error;
    try {
      await getProjectDependencies('lib1');
    } catch (e) {
      error = e;
    }
    expect(error).toEqual('thrown error');
  });
});

describe('getDependencyRootsWithVersionBuilderSchema', () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreateProjectGraphAsync.mockReset();
  });

  it('returns an empty array if trackDeps is false', async () => {
    mockCreateProjectGraphAsync.mockReturnValue(Promise.resolve(projectGraph));
    const result = await getDependencyRoots({
      trackDeps: false,
      releaseAs: undefined,
      projectName: 'demo',
      context,
    });
    expect(result).toEqual([]);
  });

  it('returns an array of dependency roots with version builder schema', async () => {
    mockCreateProjectGraphAsync.mockReturnValue(Promise.resolve(projectGraph));
    const result = await getDependencyRoots({
      trackDeps: true,
      releaseAs: undefined,
      projectName: 'demo',
      context,
    });

    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "lib1",
          "options": Object {
            "tagPrefix": "{projectName}@v",
          },
          "path": "libs/lib1",
        },
        Object {
          "name": "lib2",
          "options": Object {
            "tagPrefix": "{projectName}@v",
          },
          "path": "libs/lib2",
        },
      ]
    `);
  });

  it('returns empty dependency roots when project configuration is missing', () => {
    expect(getDependencyRootsFromProjectNames(['lib1'], undefined)).toEqual([]);
  });

  it('skips dependency roots that are not present in project configuration', () => {
    expect(
      getDependencyRootsFromProjectNames(
        ['missing', 'lib1'],
        context.projectsConfigurations,
      ),
    ).toEqual([
      {
        name: 'lib1',
        path: 'libs/lib1',
        options: {
          tagPrefix: '{projectName}@v',
        },
      },
    ]);
  });

  it('returns undefined when a project has no semver version target', () => {
    expect(
      getProjectVersionBuilderSchema({
        root: 'libs/other',
        targets: {
          build: {
            executor: '@nx/js:tsc',
          },
        },
      }),
    ).toBeUndefined();
  });

  it('returns undefined when context has no matching project', () => {
    expect(
      getProjectVersionBuilderSchemaFromContext('missing', context),
    ).toBeUndefined();
  });

  it('returns version target options from context when project exists', () => {
    expect(getProjectVersionBuilderSchemaFromContext('lib2', context)).toEqual({
      tagPrefix: '{projectName}@v',
    });
  });

  it('includes dependency roots when releaseAs is set and trackDepsWithReleaseAs is true', async () => {
    mockCreateProjectGraphAsync.mockReturnValue(Promise.resolve(projectGraph));
    const result = await getDependencyRoots({
      trackDeps: true,
      trackDepsWithReleaseAs: true,
      releaseAs: 'prerelease',
      projectName: 'lib2',
      context,
    });

    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "lib1",
          "options": Object {
            "tagPrefix": "{projectName}@v",
          },
          "path": "libs/lib1",
        },
        Object {
          "name": "lib3",
          "options": Object {
            "tagPrefix": "{projectName}@v",
          },
          "path": "libs/lib3",
        },
      ]
    `);
  });
});
