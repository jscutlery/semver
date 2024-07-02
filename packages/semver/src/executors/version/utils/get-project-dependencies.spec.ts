import { ExecutorContext, type ProjectGraph } from '@nx/devkit';
import {
  getDependencyRoots,
  getProjectDependencies,
} from './get-project-dependencies';

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

describe('projectDependencies', () => {
  const mockCreateProjectGraphAsync = jest.fn();

  beforeEach(() => {
    jest.resetModules();
  });

  jest.mock('@nx/devkit', () => ({
    createProjectGraphAsync: mockCreateProjectGraphAsync,
  }));
  jest.mock('@nx/workspace/src/core/project-graph', () => ({}));

  beforeEach(() => {
    mockCreateProjectGraphAsync.mockRestore();
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
    mockCreateProjectGraphAsync.mockReturnValue(Promise.reject('thrown error'));

    let error;
    try {
      await getProjectDependencies('lib1');
    } catch (e) {
      error = e;
    }
    expect(error).toEqual('thrown error');
  });

  describe('getDependencyRoots', () => {
    const lib1ProjectName = 'lib1';
    const lib2ProjectName = 'lib2';
    const lib3ProjectName = 'lib3';
    const context: ExecutorContext = {
      projectsConfigurations: {
        version: 1,
        projects: {
          [lib1ProjectName]: {
            root: '/path/to/lib1',
          },
          [lib2ProjectName]: {
            root: '/path/to/lib2',
          },
          [lib3ProjectName]: {
            root: '/path/to/lib3',
          },
        },
      },
      cwd: './',
      isVerbose: false,
      root: './',
    };

    it('should return an empty array when trackDeps is false', async () => {
      const result = await getDependencyRoots({
        context,
        projectName: lib2ProjectName,
        trackDeps: false,
      });
      expect(result).toEqual([]);
    });

    it('should resolve the dependencies when using trackDepsWithReleaseAs with releaseAs', async () => {
      mockCreateProjectGraphAsync.mockReturnValue(
        Promise.resolve(projectGraph),
      );

      const result = await getDependencyRoots({
        context,
        projectName: lib2ProjectName,
        releaseAs: 'prerelease',
        trackDeps: true,
        trackDepsWithReleaseAs: true,
      });
      expect(result).toStrictEqual([
        {
          name: 'lib1',
          path: '/path/to/lib1',
        },
        {
          name: 'lib3',
          path: '/path/to/lib3',
        },
      ]);
    });
  });
});
