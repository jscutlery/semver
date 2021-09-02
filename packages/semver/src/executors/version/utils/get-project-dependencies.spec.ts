import { execAsync } from './exec-async';
import { of, throwError } from 'rxjs';
import { getProjectDependencies } from './get-project-dependencies';

jest.mock('./exec-async');

const printAffectedResponse = {
  "tasks": [],
  "projects": [
    "demo",
    "demo-e2e"
  ],
  "projectGraph": {
    "nodes": [
      "demo",
      "lib1",
      "lib2",
      "npm:@mock/npm-lib1",
      "npm:@mock/npm-lib2"
    ],
    "dependencies": {
      "demo": [
        {
          "type": "static",
          "source": "demo",
          "target": "npm:@mock/npm-lib1"
        },
        {
          "type": "implicit",
          "source": "demo",
          "target": "lib1"
        },
        {
          "type": "static",
          "source": "demo",
          "target": "lib2"
        }
      ],
      "lib1": [
        {
          "type": "static",
          "source": "lib1",
          "target": "npm:@mock/npm-lib1"
        },
        {
          "type": "implicit",
          "source": "lib1",
          "target": "lib2"
        }
      ],
      "lib2": [
        {
          "type": "static",
          "source": "lib2",
          "target": "npm:@mock/npm-lib2"
        },
        {
          "type": "static",
          "source": "lib2",
          "target": "lib1"
        }
      ],
      "demo-e2e": [
        {
          "type": "implicit",
          "source": "demo-e2e",
          "target": "demo"
        }
      ]
    }
  }
}

describe('projectDependencies', () => {
  const mockExecAsync = execAsync as jest.MockedFunction<
    typeof execAsync
    >;

  afterEach(() => {
    mockExecAsync.mockRestore();
  });

  it('returns a list of libs that the project is dependent on', async () => {
    mockExecAsync.mockReturnValue(of({ stderr: undefined, stdout: JSON.stringify(printAffectedResponse) }));

    const dependencies = await getProjectDependencies('demo');
    expect(dependencies).toEqual(['lib1', 'lib2']);

    expect(mockExecAsync).toHaveBeenCalledTimes(1);
    expect(mockExecAsync).toBeCalledWith('npm', ['run', '-s', 'nx print-affected']);
  });

  it('returns a sub-dependency', async () => {
    mockExecAsync.mockReturnValue(of({ stderr: undefined, stdout: JSON.stringify(printAffectedResponse) }));

    const dependencies = await getProjectDependencies('lib1');
    expect(dependencies).toEqual(['lib2']);

    expect(mockExecAsync).toHaveBeenCalledTimes(1);
    expect(mockExecAsync).toBeCalledWith('npm', ['run', '-s', 'nx print-affected']);
  });

  it('handles a failure in retrieving the dependency graph', async () => {
    mockExecAsync.mockReturnValue(throwError({ stderr: 'thrown error', stdout: undefined }));

    let error;
    try {
      await getProjectDependencies('lib1');
    } catch (e) {
      error = e;
    }
    expect(error).toEqual('thrown error');
  });
});
