import { resolve } from 'path';
import { setupGitRepo } from '../testing/setup';
import { TestingDevkit } from '../testing/testing-devkit';

const cwd = '/tmp/project';

jest.mock('process', () => ({ cwd: () => cwd }));
jest.mock('fs/promises', () => jest.requireActual('memfs').fs.promises);
jest.mock('@nrwl/devkit', () => ({
  ...jest.requireActual('@nrwl/devkit'),
  createProjectGraphAsync: jest.fn(),
}));

describe('contract', () => {
  let testDevkit: TestingDevkit;

  beforeAll(async () => {
    await setupGitRepo({ cwd });
  });

  afterAll(() => {
    testDevkit.teardown();
  });

  describe('when semver.json does not exist or is invalid', () => {
    beforeEach(() => {
      testDevkit = new TestingDevkit(
        {
          nodes: {},
          dependencies: {},
        },
        {
          'semver.json': JSON.stringify({ value: 'JSON' }),
        }
      );
    });

    it('returns PWD', async () => {
      const result = await testDevkit.cwd();
      expect(result).toEqual('/tmp/project');
    });

    it('reads a JSON file', async () => {
      const result = await testDevkit.readFile(
        resolve(testDevkit.cwd(), 'semver.json'),
        'utf-8'
      );
      expect(result).toEqual(JSON.stringify({ value: 'JSON' }));
    });

    it('creates workspace graph', async () => {
      const result = await testDevkit.createProjectGraphAsync();
      expect(result).toEqual({
        nodes: {},
        dependencies: {},
      });
    });
  });
});
