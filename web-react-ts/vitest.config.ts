/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  // Inject VITE_AUTH_API_URL for tests only. lib/auth-service.ts throws at module
  // load time if this env var is absent. This `define` is picked up by vitest
  // but NOT by vite.config.mts, so it cannot affect production builds.
  define: {
    'import.meta.env.VITE_AUTH_API_URL': '"http://localhost:3333"',
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['src/test-utils/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
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
