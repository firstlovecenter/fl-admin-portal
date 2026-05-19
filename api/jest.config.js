module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.js'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Allow test files to import from lib/ (the shared monorepo directory
  // above api/).  modulePaths ensures @babel/runtime-corejs3 and other
  // api-installed deps are resolved even for files outside api/src/.
  modulePaths: ['<rootDir>/node_modules'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/lambda-package/',
    '\\.integration\\.test\\.',  // integration tests run via npm run test:integration
  ],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/scripts/**',
    '!src/functions/**',
  ],
  coverageReporters: ['text', 'html', 'json-summary', 'lcov'],
}
