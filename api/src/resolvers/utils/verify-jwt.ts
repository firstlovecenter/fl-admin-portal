import * as crypto from 'crypto'
import { Role } from './types'

// Hand-rolled HS256 verification: matches `@neo4j/graphql`'s
// `features.authorization.key` flow used at `api/src/index.js`. The custom
// resolver / non-Apollo paths historically relied on `jwtDecode`, which
// ONLY decodes — it does not validate the signature — so any client
// could forge a JWT with arbitrary `roles`. Locked to HS256 to defeat the
// classic `alg: none` and `alg: RS256→HS256` confusion attacks.
export type JwtPayload = {
  roles?: Role[]
  exp?: number
  [key: string]: unknown
}

const base64UrlDecode = (input: string): Buffer =>
  Buffer.from(
    input.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - (input.length % 4)) % 4),
    'base64'
  )

export const verifyJwt = (
  token: string | undefined,
  secret: string | undefined
): JwtPayload | null => {
  if (!token || !secret) return null
  const parts = token.replace(/^Bearer\s+/i, '').split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, signatureB64] = parts
  let header: { alg?: string; typ?: string }
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'))
  } catch {
    return null
  }
  if (header.alg !== 'HS256') return null

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest()
  const actual = base64UrlDecode(signatureB64)
  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(expected, actual)
  ) {
    return null
  }

  let payload: JwtPayload
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'))
  } catch {
    return null
  }
  if (typeof payload.exp === 'number' && Date.now() / 1000 >= payload.exp) {
    return null
  }
  return payload
}
