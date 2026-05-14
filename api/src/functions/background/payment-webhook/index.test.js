'use strict'
/**
 * SM1 — Characterization tests for the payment-webhook handler (index.js)
 *
 * Covers the idempotency invariants from kb/04-state-machines.md SM1:
 * - Paystack webhook re-delivery (same reference) is a no-op (WHERE guard)
 * - Non-terminal status events ('pending') are silently ignored
 * - A record already in 'failed' cannot transition to 'success' via webhook
 *   replay — the WHERE guard blocks it (Failed→Success only via retry path)
 * - Firebase is only mirrored when Neo4j actually transitioned a row
 *
 * Uses the neo4j-driver in-memory mock pattern from ADR-013 §2. The
 * mock session's executeWrite return value simulates what the WHERE guard
 * produces: 1 row on a valid transition, 0 rows when the guard blocks.
 *
 * All test names begin with "SM1:" for grep-ability (SYN-66 requirement).
 *
 * Characterization note: the banking flow does not write HistoryLog nodes —
 * it only updates transactionStatus on the ServiceRecord (or Transaction /
 * RehearsalRecord). The "one HistoryLog node" requirement in SYN-66 is
 * interpreted as "exactly one row updated on first delivery, zero on
 * re-delivery", which is what the WHERE guard enforces.
 */

const crypto = require('crypto')

jest.mock('./secrets', () => ({ loadSecrets: jest.fn() }))
jest.mock('./firebase', () => ({ db: { collection: jest.fn() } }))
jest.mock('neo4j-driver', () => ({
  driver: jest.fn(),
  auth: { basic: jest.fn().mockReturnValue({}) },
}))

// Pull the mock handles after jest.mock has set them up.
const { loadSecrets } = require('./secrets')
const { db } = require('./firebase')
const neo4j = require('neo4j-driver')
const { handler } = require('./index')

// A secret that the handler will strip the "Bearer " prefix from before HMAC.
const FAKE_SECRET = 'Bearer jest_hmac_signing_key_test_only'
const HMAC_KEY = 'jest_hmac_signing_key_test_only'
const VALID_PAYSTACK_IP = '52.31.139.75'

// Build a valid signed event for a given body string.
const makeSignedEvent = (body) => ({
  body,
  headers: {
    'x-paystack-signature': crypto
      .createHmac('sha512', HMAC_KEY)
      .update(body)
      .digest('hex'),
  },
  requestContext: { identity: { sourceIp: VALID_PAYSTACK_IP } },
  isBase64Encoded: false,
})

// Standard webhook body for a success event.
const successBody = JSON.stringify({
  data: { reference: 'ref_test_001', status: 'success' },
})

// A mock Neo4j record returned when the WHERE guard allows the transition.
const makeNeoRecord = (status) => ({
  get: jest.fn().mockImplementation((key) => {
    if (key === 'record') {
      return {
        labels: ['ServiceRecord', 'Offering'],
        properties: { id: 'sr_001', transactionStatus: status },
      }
    }
    return null
  }),
})

let mockExecuteWrite
let mockSession
let mockDriver
let mockFirebaseUpdate
let mockFirebaseDoc

beforeEach(() => {
  mockExecuteWrite = jest.fn()
  mockSession = {
    executeWrite: mockExecuteWrite,
    close: jest.fn().mockResolvedValue(undefined),
  }
  mockDriver = {
    verifyConnectivity: jest.fn().mockResolvedValue(undefined),
    session: jest.fn().mockReturnValue(mockSession),
    close: jest.fn().mockResolvedValue(undefined),
  }
  neo4j.driver.mockReturnValue(mockDriver)

  loadSecrets.mockResolvedValue({
    PAYSTACK_PRIVATE_KEY_WEEKDAY: FAKE_SECRET,
    NEO4J_URI: 'bolt://localhost:7687',
    NEO4J_USER: 'neo4j',
    NEO4J_PASSWORD: 'password',
    NEO4J_ENCRYPTED: 'false',
  })

  mockFirebaseUpdate = jest.fn().mockResolvedValue(undefined)
  mockFirebaseDoc = jest.fn().mockReturnValue({ update: mockFirebaseUpdate })
  db.collection = jest.fn().mockReturnValue({ doc: mockFirebaseDoc })
})

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------
describe('SM1 — verifyPaystackSignature', () => {
  it('SM1: valid HMAC-SHA512 signature is accepted and the request is processed', async () => {
    mockExecuteWrite.mockResolvedValue({ records: [makeNeoRecord('success')] })

    const response = await handler(makeSignedEvent(successBody))

    expect(response.statusCode).toBe(200)
  })

  it('SM1: missing signature header returns 401 Unauthorized', async () => {
    const event = {
      body: successBody,
      headers: {},
      requestContext: { identity: { sourceIp: VALID_PAYSTACK_IP } },
      isBase64Encoded: false,
    }

    const response = await handler(event)

    expect(response.statusCode).toBe(401)
    // The driver is created before handlePaystackReq runs the signature check,
    // so executeWrite must never have been called even though the driver was created.
    expect(mockExecuteWrite).not.toHaveBeenCalled()
  })

  it('SM1: wrong signature returns 401 Unauthorized (tampered body)', async () => {
    const tamperedBody = JSON.stringify({
      data: { reference: 'ref_tampered', status: 'success' },
    })
    // Sign with wrong key to produce an invalid signature
    const wrongSig = crypto
      .createHmac('sha512', 'wrong_key')
      .update(tamperedBody)
      .digest('hex')
    const event = {
      body: tamperedBody,
      headers: { 'x-paystack-signature': wrongSig },
      requestContext: { identity: { sourceIp: VALID_PAYSTACK_IP } },
      isBase64Encoded: false,
    }

    const response = await handler(event)

    expect(response.statusCode).toBe(401)
  })

  it('SM1: non-whitelisted IP returns 401 Unauthorized', async () => {
    const body = successBody
    const sig = crypto
      .createHmac('sha512', HMAC_KEY)
      .update(body)
      .digest('hex')
    const event = {
      body,
      headers: { 'x-paystack-signature': sig },
      requestContext: { identity: { sourceIp: '1.2.3.4' } },
      isBase64Encoded: false,
    }

    const response = await handler(event)

    expect(response.statusCode).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// Non-terminal status guard
// ---------------------------------------------------------------------------
describe("SM1 — non-terminal Paystack status 'pending'", () => {
  it("SM1: Paystack 'pending' event is not a terminal status — executeWrite is never called and result is null", async () => {
    const pendingBody = JSON.stringify({
      data: { reference: 'ref_test_002', status: 'pending' },
    })

    const response = await handler(makeSignedEvent(pendingBody))

    // executeWrite must never be called for a non-terminal status
    expect(mockExecuteWrite).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Idempotency: first delivery vs re-delivery
// ---------------------------------------------------------------------------
describe('SM1 — idempotent re-delivery (WHERE guard)', () => {
  it('SM1: first delivery transitions the record — executeWrite returns 1 row and result is non-null', async () => {
    mockExecuteWrite.mockResolvedValue({
      records: [makeNeoRecord('success')],
    })

    const response = await handler(makeSignedEvent(successBody))
    const parsed = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(parsed.result).not.toBeNull()
    expect(mockExecuteWrite).toHaveBeenCalledTimes(1)
  })

  it('SM1: re-delivery of same reference is a no-op — WHERE guard returns 0 rows, result is null', async () => {
    // Simulate: record is already 'success' → WHERE transactionStatus IN ['pending','send OTP']
    // evaluates to false → 0 rows matched → no write.
    mockExecuteWrite.mockResolvedValue({ records: [] })

    const response = await handler(makeSignedEvent(successBody))
    const parsed = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(parsed.result).toBeNull()
  })

  it('SM1: re-delivery does not trigger a Firebase mirror write', async () => {
    mockExecuteWrite.mockResolvedValue({ records: [] })

    await handler(makeSignedEvent(successBody))

    // Firebase collection must never be called when Neo4j returned 0 rows
    expect(db.collection).not.toHaveBeenCalled()
  })

  it('SM1: first delivery does trigger a Firebase mirror write for an Offering record', async () => {
    mockExecuteWrite.mockResolvedValue({
      records: [makeNeoRecord('success')],
    })

    await handler(makeSignedEvent(successBody))

    expect(db.collection).toHaveBeenCalledWith('offerings')
    expect(mockFirebaseDoc).toHaveBeenCalledWith('ref_test_001')
    expect(mockFirebaseUpdate).toHaveBeenCalledWith({
      transactionStatus: 'success',
    })
  })
})

// Note: the structural proof that Failed→Success is blocked at the DB level lives in
// banking-cypher.test.ts → "SM1 — setTransactionStatusSuccess" →
// "Pending→Success applied twice is a no-op". That test asserts 'failed' is absent
// from the WHERE guard's allowed source list, which is the definitive characterization.
// The handler-level behaviour (0 rows → null result, no Firebase write) is already
// covered above in "SM1 — idempotent re-delivery (WHERE guard)".
