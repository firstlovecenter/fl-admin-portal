declare module 'cors' {
  import type { RequestHandler } from 'express'

  type CorsOptions = {
    origin?:
      | boolean
      | string
      | RegExp
      | Array<string | RegExp>
      | ((
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void
        ) => void)
    methods?: string | string[]
    allowedHeaders?: string | string[]
    exposedHeaders?: string | string[]
    credentials?: boolean
    maxAge?: number
    preflightContinue?: boolean
    optionsSuccessStatus?: number
  }

  export default function cors(options?: CorsOptions): RequestHandler
}
