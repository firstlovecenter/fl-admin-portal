interface ImportMetaEnv {
  // Custom Authentication
  readonly VITE_AUTH_API_URL: string

  // GraphQL API Endpoint
  readonly VITE_SYNAGO_GRAPHQL_URI: string

  // Google Maps
  readonly VITE_GOOGLE_MAPS_API_KEY: string

  // Firebase Cloud Messaging (web push). Per-environment: dev deploys point at
  // the flc-platform-dev project, prod at flc-platform-prod. All optional —
  // absent values fall back to the dev project's public config.
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_FIREBASE_VAPID_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
