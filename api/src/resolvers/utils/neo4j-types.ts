import { Session } from 'neo4j-driver'
import { Role } from './types'

export interface JwtPayload {
  sub: string
  roles: Role[]
  iss: string
  aud: string[]
  iat: number
  exp: number
  scope: string
  azp: string
  permissions: Role[]
  // Add other properties as needed
}

export interface AuthContext {
  jwt: JwtPayload
}

export type Context = {
  jwt: JwtPayload
  executionContext: { session: () => Session }
}
