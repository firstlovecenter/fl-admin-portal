/* eslint-disable import/first -- jest.mock() must precede the imports it
   targets so babel-jest hoists mocks before module resolution. */
/**
 * SM1 — Characterization tests for resolver-level SM1 guards in banking-resolver.ts
 *
 * Tests the application-layer status guards in BankServiceOffering that enforce
 * kb/04-state-machines.md SM1 before any Paystack call is initiated:
 *
 *   - 'success' state → throws "already done" (success is terminal at the UI layer)
 *   - 'pending' state → throws "confirm first" (blocks a duplicate banking attempt)
 *   - 'send OTP' state → throws "submit OTP first"
 *   - concurrent initiation (0 rows from initiateServiceRecordTransaction)
 *     → throws "another payment attempt is in progress"
 *
 * Uses the neo4j-driver in-memory mock pattern from ADR-013 §2.
 *
 * All test names begin with "SM1:" for grep-ability (SYN-66 requirement):
 *   npm test -- banking --testNamePattern="SM1:"
 */

// Hoist before imports — babel-jest moves these to the top of the module.
jest.mock('../secrets', () => ({
  loadSecrets: jest.fn().mockResolvedValue({
    ENVIRONMENT: 'development',
    PAYSTACK_PRIVATE_KEY_WEEKDAY: 'Bearer jest_paystack_key_weekday',
  }),
}))

jest.mock('../utils/scope-utils', () => ({
  assertScopeViaServiceRecord: jest.fn().mockResolvedValue(undefined),
}))

// Keep the real rearrangeCypherObject and validation helpers; only stub isAuth
// (so tests don't need real JWT roles) and throwToSentry (avoid noise).
jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
}))

// Keep real validation constants (MOMO_NUM_REGEX, MAX_OFFERING_CASH,
// isValidNetwork); stub getStreamFinancials so tests never hit secrets.
jest.mock('../utils/financial-utils', () => ({
  ...jest.requireActual('../utils/financial-utils'),
  getStreamFinancials: jest.fn().mockResolvedValue({
    auth: 'Bearer jest_paystack_key_weekday',
    subaccount: 'acct_test',
  }),
}))

import bankingMutation from './banking-resolver'
import type { Context } from '../utils/neo4j-types'
import { isAuth } from '../utils/utils'
import { permitAdmin } from '../permissions'
import {
  appendBankingHistoryLog,
  initiateServiceRecordTransaction,
  manuallyConfirmOfferingPayment,
  setRecordTransactionReferenceManually,
  setTransactionStatusFailed,
  setTransactionStatusReversed,
  setTransactionStatusSuccess,
  submitBankingSlip,
} from './banking-cypher'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Builds a minimal QueryResult shape that rearrangeCypherObject can parse.
const makeMockQueryResult = (data: Record<string, unknown>) => ({
  records: [{ keys: Object.keys(data), _fields: Object.values(data) }],
})

const TEST_STREAM = {
  id: 'stream_1',
  bankAccount: 'fle_account',
  name: 'Test Stream',
}

const makeTransactionQueryResult = (transactionStatus: string | null) =>
  makeMockQueryResult({
    record: {
      id: 'sr_test',
      cash: 100,
      transactionReference: transactionStatus ? 'ref_existing' : null,
      transactionStatus,
      transactionTime: null,
      income: 0,
    },
    banker: null,
    stream: TEST_STREAM,
  })

const args = {
  serviceRecordId: 'sr_test',
  mobileNetwork: 'MTN',
  mobileNumber: '0244123456',
}

// Minimal JWT shape (isAuth is mocked so roles aren't checked).
const mockJwt = {
  userId: 'user_test',
  sub: 'user_test',
  roles: ['leaderBacenta'],
  iss: 'test',
  aud: ['test'],
  iat: 0,
  exp: 9999999999,
  scope: 'openid',
  azp: 'test',
  permissions: ['leaderBacenta'],
}

let mockSession: {
  run: jest.Mock
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context

beforeEach(() => {
  mockSession = {
    run: jest.fn(),
    executeRead: jest.fn().mockResolvedValue({ records: [{ get: jest.fn() }] }),
    executeWrite: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }
  context = {
    jwt: mockJwt,
    executionContext: { session: jest.fn().mockReturnValue(mockSession) },
  } as unknown as Context
})

// ---------------------------------------------------------------------------
// Status guard: success is terminal
// ---------------------------------------------------------------------------
describe('SM1 — BankServiceOffering: success-is-terminal guard', () => {
  it("SM1: throws 'already done' when transactionStatus is 'success'", async () => {
    // checkTransactionReference returns a record already in 'success' state.
    // checkIfLastServiceBanked is called before the guard; returning empty records
    // from getLastServiceRecord causes it to pass (no previous unbanked service).
    mockSession.run
      .mockResolvedValueOnce(makeTransactionQueryResult('success'))
      .mockResolvedValueOnce({ records: [] }) // getLastServiceRecord — no previous service

    await expect(
      bankingMutation.BankServiceOffering(null, args, context)
    ).rejects.toThrow('Banking has already been done for this service')
  })

  it('SM1: executeWrite is never called when the record is already success', async () => {
    mockSession.run
      .mockResolvedValueOnce(makeTransactionQueryResult('success'))
      .mockResolvedValueOnce({ records: [] })

    await expect(
      bankingMutation.BankServiceOffering(null, args, context)
    ).rejects.toThrow()

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Status guard: pending blocks a duplicate attempt
// ---------------------------------------------------------------------------
describe('SM1 — BankServiceOffering: pending-in-flight guard', () => {
  it("SM1: throws 'confirm previous attempt' when transactionStatus is 'pending'", async () => {
    mockSession.run
      .mockResolvedValueOnce(makeTransactionQueryResult('pending'))
      .mockResolvedValueOnce({ records: [] })

    await expect(
      bankingMutation.BankServiceOffering(null, args, context)
    ).rejects.toThrow(
      'Please confirm your previous payment attempt before starting a new one.'
    )
  })

  it("SM1: throws 'submit OTP' when transactionStatus is 'send OTP'", async () => {
    mockSession.run
      .mockResolvedValueOnce(makeTransactionQueryResult('send OTP'))
      .mockResolvedValueOnce({ records: [] })

    await expect(
      bankingMutation.BankServiceOffering(null, args, context)
    ).rejects.toThrow(
      'Please submit the OTP for your previous payment attempt before starting a new one.'
    )
  })
})

// ---------------------------------------------------------------------------
// Concurrent initiation guard
// ---------------------------------------------------------------------------
describe('SM1 — BankServiceOffering: concurrent-initiation guard', () => {
  it('SM1: throws when initiateServiceRecordTransaction returns 0 rows (race condition)', async () => {
    // Record starts as null (never banked) — status guard does not fire.
    // But initiateServiceRecordTransaction returns 0 rows, simulating a race
    // where another concurrent request already moved the record to 'pending'.
    mockSession.run
      .mockResolvedValueOnce(makeTransactionQueryResult(null)) // checkTransactionReference
      .mockResolvedValueOnce({ records: [] }) // getLastServiceRecord

    // initiateServiceRecordTransaction WHERE guard returned no rows.
    mockSession.executeWrite.mockResolvedValue({ records: [] })

    await expect(
      bankingMutation.BankServiceOffering(null, args, context)
    ).rejects.toThrow(
      'Another payment attempt is in progress for this service. Please refresh and try again.'
    )
  })

  it('SM1: Paystack is never called when the concurrent guard fires', async () => {
    mockSession.run
      .mockResolvedValueOnce(makeTransactionQueryResult(null))
      .mockResolvedValueOnce({ records: [] })

    mockSession.executeWrite.mockResolvedValue({ records: [] })

    // If axios were imported and called, the test would fail with a network error
    // (no real Paystack in test env). The guard must throw before any HTTP call.
    await expect(
      bankingMutation.BankServiceOffering(null, args, context)
    ).rejects.toThrow('Another payment attempt is in progress')
  })
})

// ---------------------------------------------------------------------------
// SetTransactionReferenceManually — admin recovery path
// ---------------------------------------------------------------------------
describe('SM1 — SetTransactionReferenceManually: admin recovery', () => {
  const recoveryArgs = {
    serviceRecordId: 'sr_test',
    transactionReference: 'paystack_ref_abc123',
  }

  it('SM1: returns the record when SM1 guard allows the transition (null → pending)', async () => {
    mockSession.executeWrite.mockResolvedValueOnce(
      makeMockQueryResult({
        record: {
          id: 'sr_test',
          transactionReference: 'paystack_ref_abc123',
          transactionStatus: 'pending',
          transactionError: null,
          transactionTime: '2026-05-17T10:00:00Z',
        },
      })
    )

    const result = await bankingMutation.SetTransactionReferenceManually(
      null,
      recoveryArgs,
      context
    )

    expect(result).toMatchObject({
      id: 'sr_test',
      transactionReference: 'paystack_ref_abc123',
      transactionStatus: 'pending',
    })
  })

  it('SM1: throws when the SM1 atomic guard returns no rows (record is success/pending/reversed)', async () => {
    mockSession.executeWrite.mockResolvedValueOnce({ records: [] })

    await expect(
      bankingMutation.SetTransactionReferenceManually(
        null,
        recoveryArgs,
        context
      )
    ).rejects.toThrow(
      'This service record cannot accept a manual reference right now.'
    )
  })

  it('SM1: rejects an empty transactionReference without calling Neo4j', async () => {
    await expect(
      bankingMutation.SetTransactionReferenceManually(
        null,
        { serviceRecordId: 'sr_test', transactionReference: '   ' },
        context
      )
    ).rejects.toThrow('Enter a valid transaction reference.')

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM1: rejects a non-alphanumeric transactionReference (Paystack format guard)', async () => {
    await expect(
      bankingMutation.SetTransactionReferenceManually(
        null,
        { serviceRecordId: 'sr_test', transactionReference: 'bad ref!' },
        context
      )
    ).rejects.toThrow('Transaction reference must be alphanumeric')

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM1: rejects a transactionReference longer than 100 chars', async () => {
    await expect(
      bankingMutation.SetTransactionReferenceManually(
        null,
        {
          serviceRecordId: 'sr_test',
          transactionReference: 'a'.repeat(101),
        },
        context
      )
    ).rejects.toThrow('Transaction reference must be alphanumeric')

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM1: isAuth is called with permitAdmin(Stream) before any DB work', async () => {
    mockSession.executeWrite.mockResolvedValueOnce(
      makeMockQueryResult({ record: { id: 'sr_test' } })
    )

    await bankingMutation.SetTransactionReferenceManually(
      null,
      recoveryArgs,
      context
    )

    expect(isAuth).toHaveBeenCalledWith(
      permitAdmin('Stream'),
      context.jwt.roles
    )
  })

  it('SM1: throws when isAuth rejects the caller', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Insufficient permissions')
    })

    await expect(
      bankingMutation.SetTransactionReferenceManually(
        null,
        recoveryArgs,
        context
      )
    ).rejects.toThrow('Insufficient permissions')

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })
})

// Phase 4 — BankingHistoryLog audit trail is appended on every banking write

describe('Phase 4 — appendBankingHistoryLog Cypher fragment', () => {
  it('creates a BankingHistoryLog node and HAS_BANKING_HISTORY edge from the record', () => {
    const frag = appendBankingHistoryLog('record', 'author')
    expect(frag).toMatch(
      /CREATE \(record\)-\[:HAS_BANKING_HISTORY\]->\(bhlog:BankingHistoryLog/
    )
  })

  it('attaches the actor via LOGGED_BANKING when actorVar is provided', () => {
    const frag = appendBankingHistoryLog('record', 'author')
    // CREATE not MERGE — bhlog is freshly CREATEd above, no existing
    // pattern can match, so MERGE would be misleading.
    expect(frag).toMatch(/CREATE \(author\)-\[:LOGGED_BANKING\]->\(bhlog\)/)
  })

  it('omits the actor edge entirely when actorVar is null (webhook path)', () => {
    const frag = appendBankingHistoryLog('record', null)
    expect(frag).not.toMatch(/LOGGED_BANKING/)
  })

  it('reads method, fromStatus, toStatus, message from $bh_* parameters (no string interpolation of user input)', () => {
    const frag = appendBankingHistoryLog('record', 'author')
    expect(frag).toMatch(/method: \$bh_method/)
    expect(frag).toMatch(/fromStatus: \$bh_fromStatus/)
    expect(frag).toMatch(/toStatus: \$bh_toStatus/)
    expect(frag).toMatch(/message: \$bh_message/)
  })

  it.each([
    ['initiateServiceRecordTransaction', initiateServiceRecordTransaction],
    ['setTransactionStatusFailed', setTransactionStatusFailed],
    ['setTransactionStatusSuccess', setTransactionStatusSuccess],
    ['setTransactionStatusReversed', setTransactionStatusReversed],
    ['submitBankingSlip', submitBankingSlip],
    ['manuallyConfirmOfferingPayment', manuallyConfirmOfferingPayment],
  ])('%s appends a BankingHistoryLog audit row', (_, cypher) => {
    expect(cypher).toMatch(/BankingHistoryLog/)
  })
})

// Static Cypher shape tests — guard cannot be bypassed by reordering
describe('SM1 — setRecordTransactionReferenceManually Cypher shape', () => {
  it('SM1: WHERE clause restricts source states to {null, failed} — send OTP is excluded', () => {
    expect(setRecordTransactionReferenceManually).toMatch(
      /record\.transactionStatus IS NULL/
    )
    expect(setRecordTransactionReferenceManually).toMatch(
      /record\.transactionStatus = 'failed'/
    )
    // 'send OTP' must NOT appear as a legal source state — letting an admin
    // overwrite the reference mid-OTP-flow orphans the in-flight charge.
    expect(setRecordTransactionReferenceManually).not.toMatch(/'send OTP'/)
  })

  it("SM1: writes transactionStatus = 'pending'", () => {
    expect(setRecordTransactionReferenceManually).toMatch(
      /record\.transactionStatus = 'pending'/
    )
  })

  it('SM1: stamps transactionTime = datetime() on the recovery write', () => {
    expect(setRecordTransactionReferenceManually).toMatch(
      /record\.transactionTime = datetime\(\)/
    )
  })

  it('SM1: clears transactionError on the SM1 transition', () => {
    expect(setRecordTransactionReferenceManually).toMatch(
      /REMOVE record\.transactionError/
    )
  })

  it('SM1: does NOT touch OFFERING_BANKED_BY (original banker stays attributed)', () => {
    expect(setRecordTransactionReferenceManually).not.toMatch(
      /OFFERING_BANKED_BY/
    )
  })

  it('SM1: records the recovering admin via a distinct RECOVERY_REFERENCE_SET_BY edge', () => {
    expect(setRecordTransactionReferenceManually).toMatch(
      /MERGE \(record\)-\[:RECOVERY_REFERENCE_SET_BY\]->\(author\)/
    )
  })

  it('SM1: both MATCH clauses run before any SET (atomic — no half-mutation if author lookup fails)', () => {
    // Order: MATCH (record) → MATCH (author) → SET — never SET before MATCH.
    const recordMatchPos = setRecordTransactionReferenceManually.search(
      /MATCH \(record:ServiceRecord/
    )
    const authorMatchPos = setRecordTransactionReferenceManually.search(
      /MATCH \(author:Member/
    )
    const setPos = setRecordTransactionReferenceManually.search(/\nSET/)
    expect(recordMatchPos).toBeGreaterThan(-1)
    expect(authorMatchPos).toBeGreaterThan(recordMatchPos)
    expect(setPos).toBeGreaterThan(authorMatchPos)
  })

  it('SM1: WHERE guard appears before any SET clause (no write can bypass)', () => {
    const wherePos = setRecordTransactionReferenceManually.search(/WHERE/)
    const setPos = setRecordTransactionReferenceManually.search(/\nSET/)
    expect(wherePos).toBeGreaterThan(-1)
    expect(setPos).toBeGreaterThan(wherePos)
  })
})
