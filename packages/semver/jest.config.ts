/* eslint-disable */
export default {
  displayName: 'semver',
  setupFilesAfterEnv: ['jest-extended/all'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest/legacy',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  coverageDirectory: '../../coverage/packages/semver',
  coverageReporters: ['html', 'lcov'],
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
};
