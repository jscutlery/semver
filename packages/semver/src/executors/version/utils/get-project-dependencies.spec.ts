import { getProjectDependencies } from './get-project-dependencies';
import {
  createProjectGraphAsync,
  ProjectGraph,
} from '@nrwl/workspace/src/core/project-graph';

jest.mock('@nrwl/workspace/src/core/project-graph');

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
  const mockCreateProjectGraphAsync =
    createProjectGraphAsync as jest.MockedFunction<
      typeof createProjectGraphAsync
    >;

  beforeEach(() => jest.resetModules());

  afterEach(() => {
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

  it('should support Nx < 13 project graph', async () => {
    jest.mock('@nrwl/workspace/src/core/project-graph', () => ({
      createProjectGraph: jest.fn(() => projectGraph),
    }));

    const dependencies = await getProjectDependencies('demo');

    expect(dependencies).toEqual(['lib1', 'lib2']);
  });
});
