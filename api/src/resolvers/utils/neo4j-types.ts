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
  jwt: JwtPayload
}

export type Context = {
  jwt: JwtPayload
  executionContext: { session: () => Session }
}
