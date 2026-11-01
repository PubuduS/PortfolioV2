const path = require('path');

const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  setupFiles: [
    ...(nxPreset.setupFiles ?? []),
    path.join(__dirname, 'tools/jest/node-fetch-polyfill.js'),
  ],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/*.d.ts',
    '!**/test-setup.ts',
    '!**/jest.config.ts',
    '!**/jest.config.cts',
  ],
  coverageReporters: ['html', 'json', 'json-summary', 'text-summary', 'lcov'],
};
