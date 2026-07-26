/// <reference types="vitest" />
import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import { version } from './package.json'

const srcDir = path.resolve(__dirname, 'src')

export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  // Windows path fallback: vite-tsconfig-paths include-glob matching can fail when
  // `path.relative` returns backslashes, so absolute `src/` imports never resolve.
  // Keep the plugin for non-Windows / happy paths; alias covers the baseUrl roots.
  resolve: {
    alias: [
      {
        find: /^((?:auth|components|contexts|hooks|lib|locales|pages|assets|queries|services|utils|test-utils)(?:\/.*)?)$/,
        replacement: `${srcDir}/$1`,
      },
      { find: 'permission-utils', replacement: path.join(srcDir, 'permission-utils') },
      { find: 'global-utils', replacement: path.join(srcDir, 'global-utils') },
      { find: 'global-types', replacement: path.join(srcDir, 'global-types') },
      { find: 'TestProvider', replacement: path.join(srcDir, 'TestProvider') },
    ],
  },
  // Inject VITE_AUTH_API_URL for tests only. lib/auth-service.ts throws at module
  // load time if this env var is absent. This `define` is picked up by vitest
  // but NOT by vite.config.mts, so it cannot affect production builds.
  define: {
    'import.meta.env.VITE_AUTH_API_URL': '"http://localhost:3333"',
    // vite.config.mts defines __APP_VERSION__ for production builds; SimpleLogin.tsx
    // reads it unconditionally at module scope, so tests need the same global.
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: 'jsdom',
    // Several date assertions format a `…T09:00:00Z` instant and expect the
    // UTC calendar day. Pin the runner's zone so they don't flip at UTC-10
    // and below.
    env: { TZ: 'UTC' },
    globals: false,
    setupFiles: ['src/test-utils/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'json-summary'],
      reportOnFailure: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test-utils/**',
        'src/**/*.d.ts',
        'src/global-types.ts',
      ],
    },
  },
})
