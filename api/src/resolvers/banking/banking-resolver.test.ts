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
  getStreamFinancials: jest
    .fn()
    .mockResolvedValue({ auth: 'Bearer jest_paystack_key_weekday', subaccount: 'acct_test' }),
}))

import bankingMutation from './banking-resolver'
import type { Context } from '../utils/neo4j-types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Builds a minimal QueryResult shape that rearrangeCypherObject can parse.
const makeMockQueryResult = (data: Record<string, unknown>) => ({
  records: [{ keys: Object.keys(data), _fields: Object.values(data) }],
})

const TEST_STREAM = { id: 'stream_1', bankAccount: 'fle_account', name: 'Test Stream' }

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
