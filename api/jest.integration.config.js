const base = require('./jest.config')

module.exports = {
  ...base,
  globalSetup: './jest.integration.globalSetup.js',
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/lambda-package/'],
  testMatch: ['<rootDir>/src/**/*.integration.test.ts'],
  testTimeout: 30000,
}
