interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URI?: string
  readonly PROXY: string
  readonly VITE_AUTH0_DOMAIN: string
  readonly VITE_AUTH0_CLIENT_ID: string
  readonly VITE_AUTH0_AUDIENCE: string
  readonly VITE_CLOUDINARY_MEMBERS: string
  readonly VITE_CLOUDINARY_TREASURERS: string
  readonly VITE_CLOUDINARY_SERVICES: string
  readonly VITE_WHATSAPP_REG: string
  readonly VITE_CLOUDINARY_BUSSING: string
  readonly VITE_CLOUDINARY_BANKING: string
  readonly VITE_CLOUDINARY_BUS_MOBILISATION: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_SYNAGO_GRAPHQL_URI: string
  readonly AWS_REGION: string
  readonly AWS_ACCESS_KEY_ID: string
  readonly AWS_SECRET_ACCESS_KEY: string
  readonly AWS_S3_BUCKET_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
