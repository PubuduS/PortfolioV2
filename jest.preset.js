const path = require('path');

const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  setupFiles: [
    ...(nxPreset.setupFiles ?? []),
    path.join(__dirname, 'tools/jest/node-fetch-polyfill.js'),
  ],
};
