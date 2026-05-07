import * as crypto from 'crypto'
import { verifyJwt } from './verify-jwt'

const SECRET = 'unit-test-secret'

const base64UrlEncode = (input: Buffer | string): string => {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

type Header = { alg: string; typ?: string }

const sign = (
  header: Header,
  payload: Record<string, unknown>,
  secret: string
): string => {
  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest()
  return `${headerB64}.${payloadB64}.${base64UrlEncode(signature)}`
}

describe('verifyJwt', () => {
  it('returns the payload for a valid HS256 token', () => {
    const token = sign(
      { alg: 'HS256', typ: 'JWT' },
      { roles: ['leaderBacenta'], sub: 'm1' },
      SECRET
    )
    expect(verifyJwt(token, SECRET)).toMatchObject({
      roles: ['leaderBacenta'],
      sub: 'm1',
    })
  })

  it('strips a Bearer prefix', () => {
    const token = sign(
      { alg: 'HS256', typ: 'JWT' },
      { roles: ['adminDenomination'] },
      SECRET
    )
    expect(verifyJwt(`Bearer ${token}`, SECRET)?.roles).toEqual([
      'adminDenomination',
    ])
  })

  it('rejects alg=none', () => {
    const headerB64 = base64UrlEncode(JSON.stringify({ alg: 'none' }))
    const payloadB64 = base64UrlEncode(
      JSON.stringify({ roles: ['adminDenomination'] })
    )
    const token = `${headerB64}.${payloadB64}.`
    expect(verifyJwt(token, SECRET)).toBeNull()
  })

  // alg=RS256 with the symmetric secret used as the verification key is the
  // canonical confusion attack — the verifier must require alg=HS256.
  it('rejects alg=RS256 even when payload is HMAC-signed with the secret', () => {
    const token = sign(
      { alg: 'RS256', typ: 'JWT' },
      { roles: ['adminDenomination'] },
      SECRET
    )
    expect(verifyJwt(token, SECRET)).toBeNull()
  })

  it('rejects a tampered payload', () => {
    const token = sign(
      { alg: 'HS256', typ: 'JWT' },
      { roles: ['leaderBacenta'] },
      SECRET
    )
    const [headerB64, , signatureB64] = token.split('.')
    const tamperedPayloadB64 = base64UrlEncode(
      JSON.stringify({ roles: ['adminDenomination'] })
    )
    expect(
      verifyJwt(`${headerB64}.${tamperedPayloadB64}.${signatureB64}`, SECRET)
    ).toBeNull()
  })

  it('rejects a tampered signature', () => {
    const token = sign(
      { alg: 'HS256', typ: 'JWT' },
      { roles: ['leaderBacenta'] },
      SECRET
    )
    const [headerB64, payloadB64] = token.split('.')
    const fakeSig = base64UrlEncode(Buffer.alloc(32, 0))
    expect(
      verifyJwt(`${headerB64}.${payloadB64}.${fakeSig}`, SECRET)
    ).toBeNull()
  })

  it('rejects an expired token', () => {
    const token = sign(
      { alg: 'HS256', typ: 'JWT' },
      { roles: ['leaderBacenta'], exp: Math.floor(Date.now() / 1000) - 60 },
      SECRET
    )
    expect(verifyJwt(token, SECRET)).toBeNull()
  })

  it('accepts a token with a future exp', () => {
    const token = sign(
      { alg: 'HS256', typ: 'JWT' },
      { roles: ['leaderBacenta'], exp: Math.floor(Date.now() / 1000) + 600 },
      SECRET
    )
    expect(verifyJwt(token, SECRET)?.roles).toEqual(['leaderBacenta'])
  })

  it('rejects a token with the wrong number of parts', () => {
    expect(verifyJwt('only.twoparts', SECRET)).toBeNull()
    expect(verifyJwt('a.b.c.d', SECRET)).toBeNull()
  })

  it('rejects when verified against the wrong secret', () => {
    const token = sign(
      { alg: 'HS256', typ: 'JWT' },
      { roles: ['leaderBacenta'] },
      SECRET
    )
    expect(verifyJwt(token, 'different-secret')).toBeNull()
  })

  it('returns null for empty / undefined inputs', () => {
    expect(verifyJwt(undefined, SECRET)).toBeNull()
    expect(verifyJwt('', SECRET)).toBeNull()
    const token = sign({ alg: 'HS256' }, { roles: [] }, SECRET)
    expect(verifyJwt(token, undefined)).toBeNull()
    expect(verifyJwt(token, '')).toBeNull()
  })

  it('rejects a malformed header that is not valid JSON', () => {
    const headerB64 = base64UrlEncode('not-json')
    const payloadB64 = base64UrlEncode(JSON.stringify({ roles: [] }))
    const sig = crypto
      .createHmac('sha256', SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest()
    const token = `${headerB64}.${payloadB64}.${base64UrlEncode(sig)}`
    expect(verifyJwt(token, SECRET)).toBeNull()
  })
})
