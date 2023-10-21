/* eslint-disable */
export default {
  displayName: 'semver',
  setupFilesAfterEnv: ['jest-extended/all'],
  transform: {},
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  coverageDirectory: '../../coverage/packages/semver',
  coverageReporters: ['html', 'lcov'],
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
};
