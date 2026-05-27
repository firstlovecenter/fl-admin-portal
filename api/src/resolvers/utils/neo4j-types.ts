import { Session } from 'neo4j-driver'
import { Role } from './types'
import { ServantTree } from './allowed-church-ids'

export interface JwtPayload {
  userId: string
  sub: string
  roles: Role[]
  iss: string
  aud: string[]
  iat: number
  exp: number
  scope: string
  azp: string
  permissions: Role[]
  // Server-injected at request time from the user's Neo4j servant edges.
  // See `api/src/resolvers/utils/allowed-church-ids.ts` and the
  // `expressMiddleware` context builder in `api/src/index.js`.
  servantTrees?: ServantTree[]
  allowedChurchIds?: string[]
  // Add other properties as needed
}

export interface AuthContext {
  // `jwt` is undefined when the incoming request has no verifiable token.
  // The two Apollo bootstraps deliberately leave the property unset on
  // rejection: `@neo4j/graphql`'s `getAuthorizationContext` does
  // `if (context.jwt)` (truthy check) and trusts ANY value, so passing a
  // sentinel like `{}` made the library treat anonymous requests as
  // authenticated and defeated schema-level `@authentication`. Callers MUST
  // either go through `isAuth(...)` (which throws FORBIDDEN on missing
  // roles) or use optional chaining when reading claims.
  jwt?: JwtPayload
}

export type Context = {
  jwt?: JwtPayload
  executionContext: { session: () => Session }
}
