import { defineConfig, loadEnv } from 'vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import svgrPlugin from 'vite-plugin-svgr'
import dns from 'dns'
import * as manifest from './public/manifest.json'
import { version } from './package.json'

// https://vitejs.dev/config/

dns.setDefaultResultOrder('verbatim')

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      open: true,
      port: 3000,
    },
    build: {
      // 'hidden' still emits .map files (so Sentry can resolve stack traces)
      // but omits the `//# sourceMappingURL=` comment, so browsers never fetch
      // them. Combined with the Sentry plugin's filesToDeleteAfterUpload below
      // and the amplify.yml strip guard, no .map is served publicly (SYN-174).
      sourcemap: 'hidden',
    },
    define: {
      // Inject the package.json version at build time so the UI never drifts
      // from the released version. Referenced as __APP_VERSION__.
      __APP_VERSION__: JSON.stringify(version),
    },
    plugins: [
      tailwindcss(),
      react(),
      viteTsconfigPaths(),
      svgrPlugin(),
      VitePWA({
        injectRegister: 'auto',
        registerType: 'autoUpdate',
        manifest: manifest,
        // Workbox ignores vite's build.sourcemap and emits sw.js.map /
        // workbox-*.js.map with a sourceMappingURL comment. We don't ship SW
        // maps to Sentry, so disable them outright to avoid leaking source and
        // to keep the strip guard from leaving a dangling comment (SYN-174).
        workbox: {
          sourcemap: false,
        },
      }),
      // Put the Sentry vite plugin after all other plugins (only if auth token is available)
      ...(env.SENTRY_AUTH_TOKEN
        ? [
            sentryVitePlugin({
              org: 'first-love-center',
              project: 'fap-frontend-fix',

              // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
              // and need `project:releases` and `org:read` scopes
              authToken: env.SENTRY_AUTH_TOKEN,

              sourcemaps: {
                // Specify the directory containing build artifacts
                assets: './dist/**',
                // Delete the .map files once uploaded to Sentry so they are
                // never shipped to the production origin (SYN-174).
                filesToDeleteAfterUpload: ['./dist/**/*.map'],
              },

              // Use the following option if you're on an SDK version lower than 7.47.0:
              // include: "./dist",

              // Optionally uncomment the line below to override automatic release name detection
              // release: env.RELEASE,
            }),
          ]
        : []),
    ],
  }
})
