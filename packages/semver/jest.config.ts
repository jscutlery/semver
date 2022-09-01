/* eslint-disable */
export default {
  displayName: 'semver',
  setupFilesAfterEnv: ['jest-extended/all'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest/legacy',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  coverageDirectory: '../../coverage/packages/semver',
  coverageReporters: ['html', 'lcov'],
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
};
