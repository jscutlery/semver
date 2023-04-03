import { resolve } from 'path';

describe('Devkit', () => {
  describe('ConcreteDevkit', () => {
    // Use require to avoid mock hoisting
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ConcreteDevkit = require('../release/devkit').ConcreteDevkit;
    const devkit = new ConcreteDevkit();

    it('returns PWD', async () => {
      const result = await devkit.cwd();
      expect(result).toEqual(process.cwd());
    });

    it('reads JSON file', async () => {
      const result = await devkit.readFile(
        resolve(devkit.cwd(), 'semver.json')
      );
      expect(JSON.parse(result)).toEqual({
        packages: [
          { name: 'semver', type: 'independent', path: 'packages/semver' },
        ],
      });
    });

    it('reads workspace graph', async () => {
      const result = await devkit.createGraph();
      expect(result).toEqual(
        expect.objectContaining({
          nodes: expect.objectContaining({
            semver: expect.objectContaining({
              name: 'semver',
            }),
          }),
        })
      );
    });
  });

  describe('TestingDevkit', () => {
    // Use require to avoid mock hoisting
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TestingDevkit = require('./devkit').TestingDevkit;
    const devkit = new TestingDevkit(
      {
        'semver.json': JSON.stringify({ value: 'JSON' }),
      },
      {
        nodes: {
          project: {
            name: 'project',
            type: 'app',
          },
        },
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

    it('reads workspace graph', async () => {
      const result = await devkit.createGraph();
      expect(result).toEqual(
        expect.objectContaining({
          nodes: expect.objectContaining({
            project: expect.objectContaining({
              name: 'project',
            }),
          }),
        })
      );
    });
  });
});
