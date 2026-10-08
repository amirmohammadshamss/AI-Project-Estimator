/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  watchman: false,
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: ['**/*.(t|j)s'],
};
