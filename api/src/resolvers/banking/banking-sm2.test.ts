/* eslint-disable import/first -- jest.mock() must precede the imports it
   targets so babel-jest hoists mocks before module resolution. */
/**
 * SM2 — Characterization tests for banking proof presence in banking-resolver.ts
 *
 * SM2 (kb/04-state-machines.md): A service is considered banked when at least one
 * of the following is true:
 *   - bankingSlip field is set (manual upload), OR
 *   - transactionStatus === 'success' (Paystack self-banking), OR
 *   - tellerConfirmationTime field is set (teller manually confirmed)
 *
 * Covers:
 *   - checkIfLastServiceBanked — all three proof paths + negative
 *   - ManuallyConfirmOfferingPayment — auth scope + tellerStream church-level guard
 *   - SubmitBankingSlip — auth + Cypher WHERE guard
 *   - submitBankingSlip / manuallyConfirmOfferingPayment Cypher strings
 *
 * All test names begin with "SM2:" for grep-ability (SYN-67):
 *   npm test -- banking-sm2 --testNamePattern="SM2:"
 */

jest.mock('../secrets', () => ({
  loadSecrets: jest.fn().mockResolvedValue({
    ENVIRONMENT: 'development',
    PAYSTACK_PRIVATE_KEY_WEEKDAY: 'Bearer jest_paystack_key_weekday',
  }),
}))

jest.mock('../utils/scope-utils', () => ({
  assertScopeViaServiceRecord: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
}))

jest.mock('../utils/financial-utils', () => ({
  ...jest.requireActual('../utils/financial-utils'),
  getStreamFinancials: jest.fn().mockResolvedValue({
    auth: 'Bearer jest_paystack_key_weekday',
    subaccount: 'acct_test',
  }),
}))

import bankingMutation, { checkIfLastServiceBanked } from './banking-resolver'
import {
  submitBankingSlip,
  manuallyConfirmOfferingPayment as manuallyConfirmCypher,
} from './banking-cypher'
import type { Context } from '../utils/neo4j-types'
import { isAuth } from '../utils/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMockQueryResult = (data: Record<string, unknown>) => ({
  records: [{ keys: Object.keys(data), _fields: Object.values(data) }],
})

const makeLastServiceResult = (serviceProps: Record<string, unknown>) =>
  makeMockQueryResult({
    lastService: { properties: serviceProps },
    lastDate: { properties: { date: '2024-01-07' } },
    record: { properties: { id: 'sr_test' } },
    church: {},
  })

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
    executeRead: jest.fn(),
    executeWrite: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }
  context = {
    jwt: mockJwt,
    executionContext: { session: jest.fn().mockReturnValue(mockSession) },
  } as unknown as Context
})

// ---------------------------------------------------------------------------
// checkIfLastServiceBanked — SM2 proof presence
// ---------------------------------------------------------------------------
describe('SM2 — checkIfLastServiceBanked: proof presence', () => {
  it('SM2: returns true when there is no prior service record (nothing to bank against)', async () => {
    mockSession.run.mockResolvedValueOnce({ records: [] })
    const result = await checkIfLastServiceBanked('sr_test', context)
    expect(result).toBe(true)
  })

  it('SM2: returns true when the prior service has bankingSlip set', async () => {
    mockSession.run.mockResolvedValueOnce(
      makeLastServiceResult({
        bankingSlip: 'https://res.cloudinary.com/slip.jpg',
      })
    )
    const result = await checkIfLastServiceBanked('sr_test', context)
    expect(result).toBe(true)
  })

  it("SM2: returns true when the prior service has transactionStatus = 'success'", async () => {
    mockSession.run.mockResolvedValueOnce(
      makeLastServiceResult({ transactionStatus: 'success' })
    )
    const result = await checkIfLastServiceBanked('sr_test', context)
    expect(result).toBe(true)
  })

  it('SM2: returns true when the prior service has tellerConfirmationTime set', async () => {
    mockSession.run.mockResolvedValueOnce(
      makeLastServiceResult({
        tellerConfirmationTime: '2024-01-07T10:00:00.000Z',
      })
    )
    const result = await checkIfLastServiceBanked('sr_test', context)
    expect(result).toBe(true)
  })

  it('SM2: throws when the prior service record has none of the three proof fields', async () => {
    mockSession.run.mockResolvedValueOnce(
      makeLastServiceResult({ transactionStatus: null })
    )
    await expect(checkIfLastServiceBanked('sr_test', context)).rejects.toThrow(
      'Please bank outstanding offering'
    )
  })
})

// ---------------------------------------------------------------------------
// ManuallyConfirmOfferingPayment — auth
// ---------------------------------------------------------------------------
describe('SM2 — ManuallyConfirmOfferingPayment: auth', () => {
  const confirmArgs = { serviceRecordId: 'sr_test', bankingSlip: '' }

  it('SM2: isAuth is called with the fishers + teller roles', async () => {
    mockSession.executeRead.mockResolvedValueOnce({
      records: [{ get: jest.fn().mockReturnValue(['Stream', 'Bacenta']) }],
    })
    mockSession.run
      .mockResolvedValueOnce({ records: [] })
      .mockResolvedValueOnce(
        makeMockQueryResult({ service: { properties: { id: 'sr_test' } } })
      )

    await bankingMutation.ManuallyConfirmOfferingPayment(
      null,
      confirmArgs,
      context
    )

    expect(isAuth).toHaveBeenCalledWith(
      expect.arrayContaining(['fishers']),
      context.jwt?.roles
    )
  })

  it('SM2: throws when isAuth rejects the caller (non-teller role)', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Insufficient permissions')
    })

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(null, confirmArgs, context)
    ).rejects.toThrow('Insufficient permissions')
  })

  it('SM2: tellerStream role is blocked when the church is not Stream/Campus/Oversight/Denomination', async () => {
    const tellerContext = {
      ...context,
      jwt: { ...mockJwt, roles: ['tellerStream'] },
    } as unknown as Context

    mockSession.executeRead.mockResolvedValueOnce({
      records: [{ get: jest.fn().mockReturnValue(['Bacenta']) }],
    })

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(
        null,
        confirmArgs,
        tellerContext
      )
    ).rejects.toThrow('not allowed to manually confirm')
  })

  it('SM2: fishers role is also blocked when the church is not Stream+ (church-level guard applies to all callers)', async () => {
    const fishersContext = {
      ...context,
      jwt: { ...mockJwt, roles: ['fishers'] },
    } as unknown as Context

    mockSession.executeRead.mockResolvedValueOnce({
      records: [{ get: jest.fn().mockReturnValue(['Bacenta']) }],
    })

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(
        null,
        confirmArgs,
        fishersContext
      )
    ).rejects.toThrow('not allowed to manually confirm')
  })

  it('SM2: tellerStream role IS allowed when the church is a Stream', async () => {
    const tellerContext = {
      ...context,
      jwt: { ...mockJwt, roles: ['tellerStream'] },
    } as unknown as Context

    mockSession.executeRead.mockResolvedValueOnce({
      records: [{ get: jest.fn().mockReturnValue(['Stream', 'Bacenta']) }],
    })
    mockSession.run
      .mockResolvedValueOnce({ records: [] })
      .mockResolvedValueOnce(
        makeMockQueryResult({ service: { properties: { id: 'sr_test' } } })
      )

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(
        null,
        confirmArgs,
        tellerContext
      )
    ).resolves.toMatchObject({ id: 'sr_test' })
  })

  it('SM2: fishers role IS allowed when the church is a Stream+', async () => {
    const fishersContext = {
      ...context,
      jwt: { ...mockJwt, roles: ['fishers'] },
    } as unknown as Context

    mockSession.executeRead.mockResolvedValueOnce({
      records: [{ get: jest.fn().mockReturnValue(['Stream', 'Bacenta']) }],
    })
    mockSession.run
      .mockResolvedValueOnce({ records: [] })
      .mockResolvedValueOnce(
        makeMockQueryResult({ service: { properties: { id: 'sr_test' } } })
      )

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(
        null,
        confirmArgs,
        fishersContext
      )
    ).resolves.toMatchObject({ id: 'sr_test' })
  })
})

// ---------------------------------------------------------------------------
// ManuallyConfirmOfferingPayment — behavior
// ---------------------------------------------------------------------------
describe('SM2 — ManuallyConfirmOfferingPayment: behavior', () => {
  const confirmArgs = { serviceRecordId: 'sr_test', bankingSlip: '' }

  it('SM2: calls session.run for the manuallyConfirmOfferingPayment Cypher and returns the service record', async () => {
    mockSession.executeRead.mockResolvedValueOnce({
      records: [{ get: jest.fn().mockReturnValue(['Stream', 'Bacenta']) }],
    })
    mockSession.run
      .mockResolvedValueOnce({ records: [] })
      .mockResolvedValueOnce(
        makeMockQueryResult({
          service: {
            properties: {
              id: 'sr_test',
              tellerConfirmationTime: '2024-01-07T10:00:00Z',
            },
          },
        })
      )

    const result = await bankingMutation.ManuallyConfirmOfferingPayment(
      null,
      confirmArgs,
      context
    )

    expect(result).toMatchObject({ id: 'sr_test' })
    expect(mockSession.run).toHaveBeenCalledTimes(2)
  })

  it('SM2: throws "already confirmed" when the SM2 atomic guard returns zero rows', async () => {
    mockSession.executeRead.mockResolvedValueOnce({
      records: [{ get: jest.fn().mockReturnValue(['Stream', 'Bacenta']) }],
    })
    mockSession.run
      .mockResolvedValueOnce({ records: [] }) // checkIfLastServiceBanked
      .mockResolvedValueOnce({ records: [] }) // confirmOfferingPayment Cypher — zero rows = race lost

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(null, confirmArgs, context)
    ).rejects.toThrow(
      'This offering has already been confirmed by another teller.'
    )
  })

  // TODO (SM2): ManuallyConfirmOfferingPayment does not append a HistoryLog node.
  // Current behaviour: sets tellerConfirmationTime + CONFIRMED_BANKING_FOR relationship only.
  // The Jira ticket (SYN-67) flags a HistoryLog entry as desired; characterised here per ADR-013 §3.1.
  // Phase 4 of the banking-flows audit adds this via BankingHistoryLog + appendBankingHistoryLog.
  it.todo(
    'SM2 TODO: ManuallyConfirmOfferingPayment appends a BankingHistoryLog entry naming the confirming teller (Phase 4)'
  )
})

// ---------------------------------------------------------------------------
// SubmitBankingSlip — auth
// ---------------------------------------------------------------------------
describe('SM2 — SubmitBankingSlip: auth', () => {
  const slipArgs = {
    serviceRecordId: 'sr_test',
    bankingSlip: 'https://res.cloudinary.com/slip.jpg',
  }

  it('SM2: isAuth is called with permitAdmin(Campus) roles', async () => {
    mockSession.run
      .mockResolvedValueOnce({ records: [] })
      .mockResolvedValueOnce(
        makeMockQueryResult({ record: { properties: { id: 'sr_test' } } })
      )

    await bankingMutation.SubmitBankingSlip(null, slipArgs, context)

    const { permitAdmin } = jest.requireActual(
      '../permissions'
    ) as typeof import('../permissions')
    expect(isAuth).toHaveBeenCalledWith(
      permitAdmin('Campus'),
      context.jwt?.roles
    )
  })

  it('SM2: throws when isAuth rejects the caller (non-campus-admin role)', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Insufficient permissions')
    })

    await expect(
      bankingMutation.SubmitBankingSlip(null, slipArgs, context)
    ).rejects.toThrow('Insufficient permissions')
  })
})

// ---------------------------------------------------------------------------
// submitBankingSlip Cypher — WHERE guard (SM2 terminal state protection)
// ---------------------------------------------------------------------------
describe("SM2 — submitBankingSlip Cypher: blocks 'pending' and 'success' states", () => {
  it("SM2: WHERE clause excludes 'pending' and 'success' from allowed source states (full guard shape)", () => {
    // Guard must cover both: no status yet (IS NULL) AND not already in a terminal state.
    // Removing the IS NULL branch would silently allow re-submission for never-banked records.
    expect(submitBankingSlip).toMatch(/record\.transactionStatus IS NULL/)
    expect(submitBankingSlip).toMatch(
      /NOT record\.transactionStatus IN \['pending', 'success'\]/
    )
  })

  it('SM2: WHERE guard appears before the first SET clause (no write can bypass the check)', () => {
    const wherePos = submitBankingSlip.search(/WHERE/)
    const setPos = submitBankingSlip.search(/\nSET/)
    expect(wherePos).toBeGreaterThan(-1)
    expect(setPos).toBeGreaterThan(wherePos)
  })
})

// ---------------------------------------------------------------------------
// manuallyConfirmOfferingPayment Cypher — SM2 atomic guard
// ---------------------------------------------------------------------------
describe('SM2 — manuallyConfirmOfferingPayment Cypher: atomic idempotency guard', () => {
  it('SM2: WHERE guard restricts the write to tellerConfirmationTime IS NULL (no double-confirm race)', () => {
    expect(manuallyConfirmCypher).toMatch(
      /WHERE service\.tellerConfirmationTime IS NULL/
    )
  })

  it('SM2: WHERE guard appears before any SET clause (no write can bypass)', () => {
    const wherePos = manuallyConfirmCypher.search(/WHERE/)
    const setPos = manuallyConfirmCypher.search(/\nSET/)
    expect(wherePos).toBeGreaterThan(-1)
    expect(setPos).toBeGreaterThan(wherePos)
  })

  it('SM2: does NOT guard on transactionStatus — teller confirmation is independent of the self-bank state machine', () => {
    // The Cypher should still confirm a record that is also in 'pending'
    // self-bank state (rare but valid: teller takes cash while a self-bank
    // attempt is in flight). Only tellerConfirmationTime gates this write.
    expect(manuallyConfirmCypher).not.toMatch(/service\.transactionStatus\s+IN/)
  })

  it('SM2: sets tellerConfirmationTime on the service record', () => {
    expect(manuallyConfirmCypher).toMatch(
      /service\.tellerConfirmationTime = datetime\(\)/
    )
  })

  it('SM2: creates CONFIRMED_BANKING_FOR relationship for audit trail', () => {
    expect(manuallyConfirmCypher).toMatch(/CONFIRMED_BANKING_FOR/)
  })
})
