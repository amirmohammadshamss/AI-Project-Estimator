const nextJest = require('next/jest');
module.exports = nextJest({ dir: './' })({
  testEnvironment: 'jsdom',
  watchman: false,
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
});
