interface ImportMetaEnv {
  // Custom Authentication
  readonly VITE_AUTH_API_URL: string

  // GraphQL API Endpoint
  readonly VITE_SYNAGO_GRAPHQL_URI: string

  // Google Maps
  readonly VITE_GOOGLE_MAPS_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
