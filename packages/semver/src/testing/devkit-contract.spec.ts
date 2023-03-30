import { resolve } from 'path';

describe('Devkit Contract', () => {
  describe('ConcreteDevkit', () => {
    const readFileMock = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ value: 'JSON' }));
    const createGraphMock = jest.fn().mockResolvedValue({
      nodes: {},
      dependencies: {},
    });

    jest.mock('process', () => ({ cwd: () => '/tmp/test' }));
    jest.mock('fs/promises', () => ({
      readFile: readFileMock,
    }));
    jest.mock('@nrwl/devkit', () => ({
      createProjectGraphAsync: createGraphMock,
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ConcreteDevkit = require('../release/devkit').ConcreteDevkit;
    const devkit = new ConcreteDevkit();

    it('returns PWD', async () => {
      const result = await devkit.cwd();
      expect(result).toEqual('/tmp/test');
    });

    it('reads JSON file', async () => {
      const result = await devkit.readFile(
        resolve(devkit.cwd(), 'semver.json')
      );
      expect(result).toEqual(JSON.stringify({ value: 'JSON' }));
    });

    it('creates workspace graph', async () => {
      const result = await devkit.createGraph();
      expect(result).toEqual({
        nodes: {},
        dependencies: {},
      });
    });
  });

  describe('TestingDevkit', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TestingDevkit = require('../testing/testing-devkit').TestingDevkit;
    const devkit = new TestingDevkit(
      {
        nodes: {},
        dependencies: {},
      },
      {
        'semver.json': JSON.stringify({ value: 'JSON' }),
      },
      '/tmp/project'
    );

    afterAll(() => {
      devkit.teardown();
    });

    it('returns PWD', async () => {
      const result = await devkit.cwd();
      expect(result).toEqual('/tmp/project');
    });

    it('reads JSON file', async () => {
      const result = await devkit.readFile(
        resolve(devkit.cwd(), 'semver.json')
      );
      expect(result).toEqual(JSON.stringify({ value: 'JSON' }));
    });

    it('creates workspace graph', async () => {
      const result = await devkit.createGraph();
      expect(result).toEqual({
        nodes: {},
        dependencies: {},
      });
    });
  });
});
