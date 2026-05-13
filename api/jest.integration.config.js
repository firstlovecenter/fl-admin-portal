const base = require('./jest.config')

module.exports = {
  ...base,
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/lambda-package/'],
  testMatch: ['<rootDir>/src/**/*.integration.test.ts'],
}
