import * as crypto from 'crypto'
import { ChurchScopes, Role } from './types'

// Hand-rolled HS256 verification: matches `@neo4j/graphql`'s
// `features.authorization.key` flow used at `api/src/index.js`. The custom
// resolver / non-Apollo paths historically relied on `jwtDecode`, which
// ONLY decodes — it does not validate the signature — so any client
// could forge a JWT with arbitrary `roles`. Locked to HS256 to defeat the
// classic `alg: none` and `alg: RS256→HS256` confusion attacks.
export type JwtPayload = {
  userId?: string
  email?: string
  roles?: Role[]
  churchScopes?: ChurchScopes
  iss?: string
  aud?: string | string[]
  exp?: number
  [key: string]: unknown
}

/**
 * Optional claim-validation pins (SYN-176). The symmetric `JWT_SECRET` is shared
 * with the auth service, so a valid signature alone does not prove the token was
 * minted *for this API*. When `expectedIss` / `expectedAud` are supplied (wired
 * from `SECRETS.JWT_ISSUER` / `SECRETS.JWT_AUDIENCE`), the token's `iss` / `aud`
 * must match or the token is rejected.
 *
 * These are deliberately gated on configuration so enforcement can be flipped on
 * via Secrets Manager *after* the auth service is deployed to mint iss/aud-
 * bearing tokens — avoiding a hard cross-service deploy-ordering outage. Once the
 * secrets are set in `dev/`/`prod/fl-admin-portal`, tokens missing or carrying
 * the wrong `iss`/`aud` are rejected. The `exp` requirement below is always on
 * (every legitimately-minted token carries an `exp`).
 */
export type VerifyJwtOptions = {
  expectedIss?: string
  expectedAud?: string
}

const base64UrlDecode = (input: string): Buffer =>
  Buffer.from(
    input.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - (input.length % 4)) % 4),
    'base64'
  )

export const verifyJwt = (
  token: string | undefined,
  secret: string | undefined,
  options: VerifyJwtOptions = {}
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
  // Reject tokens with no `exp` (never-expiring) and any past their expiry.
  // Always on: a legitimately-minted token always carries an `exp`.
  if (typeof payload.exp !== 'number' || Date.now() / 1000 >= payload.exp) {
    return null
  }

  // Reject tokens not minted for this API. Only enforced when the expected
  // values are configured (see VerifyJwtOptions) so the rollout stays safe.
  const { expectedIss, expectedAud } = options
  if (expectedIss && payload.iss !== expectedIss) {
    return null
  }
  if (expectedAud) {
    const audOk = Array.isArray(payload.aud)
      ? payload.aud.includes(expectedAud)
      : payload.aud === expectedAud
    if (!audOk) return null
  }

  return payload
}
