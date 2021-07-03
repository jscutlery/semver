module.exports = {
  displayName: 'semver',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['jest-extended'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  coverageDirectory: '../../coverage/packages/semver',
  coverageReporters: ['html', 'lcov'],
  testEnvironment: 'node',
};
