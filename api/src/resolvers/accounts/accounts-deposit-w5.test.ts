/**
 * W5 — Characterization tests for the account deposit / debit workflow.
 *
 * W5 (kb/03-workflows.md):
 *
 *   1. Council weekday deposit  — DepositIntoCouncilCurrentAccount
 *   2. Council bussing deposit  — DepositIntoCouncilBussingSociety
 *   3. Bussing society direct debit — DebitBussingSociety
 *   4. Expense request / approve / decline  [accounts-expense-sm6.test.ts]
 *
 * Coverage:
 *   - Deposit: weekdayBalance increments by exactly the deposit amount on first write
 *   - Deposit: MERGE keyed on clientTransactionId — idempotent across retries (ADR-005)
 *   - Deposit: isNew=true → SMS fired; isNew=false → no SMS (no duplicate notifications)
 *   - Deposit: assertAccountsAccess gate (fishers + church-scoped role required)
 *   - BussingSociety deposit: depositAmount = args.bussingSocietyBalance - council.bussingSocietyBalance
 *     (can be negative — a negative deposit is a deduction, not an error)
 *   - DebitBussingSociety: debits bussing society directly; same isNew + SMS pattern
 *   - Cypher: depositIntoCouncilCurrentAccount uses MERGE + FOREACH so only the first write
 *     mutates the council balance — a replay reads back the existing transaction unchanged
 *   - Cypher: depositIntoCoucilBussingSociety same pattern
 *
 * All test names begin with "W5:" for grep-ability (SYN-74):
 *   npm test -- accounts-deposit-w5 --testNamePattern="W5:"
 */

jest.mock('../secrets', () => ({
  loadSecrets: jest.fn().mockResolvedValue({
    ENVIRONMENT: 'development',
    FLC_NOTIFY_KEY: 'jest_notify_key',
  }),
}))

jest.mock('../utils/scope-utils', () => ({
  assertChurchScope: jest.fn().mockResolvedValue(undefined),
  assertScopeViaTransaction: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
}))

jest.mock('../utils/notify', () => ({
  sendBulkSMS: jest.fn().mockResolvedValue('Message sent successfully'),
}))

import accountsMutations from './accounts-resolvers'
import {
  depositIntoCouncilCurrentAccount,
  depositIntoCoucilBussingSociety,
  debitBussingSociety,
  getCouncilBalances,
} from './accounts-cypher'
import type { Context } from '../utils/neo4j-types'
import { sendBulkSMS } from '../utils/notify'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Flexible record helper: values are returned as-is from .get(key), so
// { properties: {...} } objects work for `.get('council').properties` AND
// raw booleans work for `.get('isNew')` in the same record.
//
// This differs from the `propRec` helper in accounts-expense-sm6.test.ts, which
// wraps everything in `{ properties: value }`. That approach cannot represent the
// mixed-shape RETURN in depositIntoCouncilCurrentAccount where `isNew` is a raw
// boolean on the same row as `.properties`-bearing neo4j nodes. Do NOT replace
// `rec()` with `propRec()` — it would silently make isNew=false truthy.
const rec = (data: Record<string, unknown>) => ({
  get: (key: string) => data[key],
})

const mockJwt = {
  userId: 'user_admin_1',
  sub: 'user_admin_1',
  roles: ['leaderCouncil', 'fishers'] as const,
  iss: 'test',
  aud: ['test'],
  iat: 0,
  exp: 9999999999,
  scope: 'openid',
  azp: 'test',
  permissions: ['leaderCouncil', 'fishers'] as const,
}

let mockSession: {
  run: jest.Mock
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context

beforeEach(() => {
  jest.clearAllMocks()
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

  // Pin clock to a time inside the 06:00–15:00 UTC accounts window.
  jest.useFakeTimers().setSystemTime(new Date('2026-05-14T10:00:00Z'))
})

afterEach(() => {
  jest.useRealTimers()
})

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

const councilRec = (overrides: Record<string, unknown> = {}) =>
  rec({
    council: {
      properties: {
        id: 'council_1',
        name: 'Test Council',
        weekdayBalance: 1000,
        bussingSocietyBalance: 200,
        ...overrides,
      },
    },
    leader: {
      properties: {
        id: 'leader_1',
        firstName: 'Lead',
        lastName: 'Pastor',
        phoneNumber: '0240000000',
      },
    },
  })

const depositRec = ({
  isNew = true,
  weekdayBalance = 1500,
}: {
  isNew?: boolean
  weekdayBalance?: number
} = {}) =>
  rec({
    isNew,
    council: { properties: { id: 'council_1', weekdayBalance } },
    transaction: {
      properties: {
        id: 'txn_dep_1',
        amount: 500,
        status: 'success',
        account: 'Weekday Account',
        weekdayBalance,
        bussingSocietyBalance: 200,
      },
    },
    depositor: {
      properties: { id: 'user_admin_1', firstName: 'Test', lastName: 'Admin' },
    },
  })

const bussingDepositRec = ({
  isNew = true,
  bussingSocietyBalance = 500,
}: {
  isNew?: boolean
  bussingSocietyBalance?: number
} = {}) =>
  rec({
    isNew,
    council: { properties: { id: 'council_1', bussingSocietyBalance } },
    transaction: {
      properties: {
        id: 'txn_buss_1',
        amount: 300,
        status: 'success',
        account: 'Bussing Society',
        bussingSocietyBalance,
        weekdayBalance: 1000,
      },
    },
    depositor: {
      properties: { id: 'user_admin_1', firstName: 'Test', lastName: 'Admin' },
    },
  })

// ===========================================================================
// DepositIntoCouncilCurrentAccount
// ===========================================================================
describe('W5 — DepositIntoCouncilCurrentAccount: weekday balance deposit', () => {
  const depositArgs = {
    councilId: 'council_1',
    weekdayBalanceDepositAmount: 500,
    clientTransactionId: 'ctx_dep_1',
  }

  it('W5: happy path — runs getCouncilBalances then depositIntoCouncilCurrentAccount', async () => {
    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec()] })
      .mockResolvedValueOnce({ records: [depositRec({ isNew: true })] })

    const result = await accountsMutations.DepositIntoCouncilCurrentAccount(
      null,
      depositArgs,
      context
    )

    expect(mockSession.run).toHaveBeenCalledTimes(2)
    expect(mockSession.run.mock.calls[0][0]).toBe(getCouncilBalances)
    expect(mockSession.run.mock.calls[1][0]).toBe(depositIntoCouncilCurrentAccount)

    expect(result).toMatchObject({
      id: 'txn_dep_1',
      status: 'success',
    })
  })

  it('W5: isNew=true → SMS sent to leader (first deposit fires notification)', async () => {
    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec()] })
      .mockResolvedValueOnce({ records: [depositRec({ isNew: true })] })

    await accountsMutations.DepositIntoCouncilCurrentAccount(
      null,
      depositArgs,
      context
    )

    expect(sendBulkSMS).toHaveBeenCalledTimes(1)
    expect(sendBulkSMS).toHaveBeenCalledWith(
      ['0240000000'],
      expect.stringContaining('500')
    )
  })

  it('W5: isNew=false → SMS suppressed (idempotent retry must not re-notify)', async () => {
    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec()] })
      .mockResolvedValueOnce({ records: [depositRec({ isNew: false })] })

    await accountsMutations.DepositIntoCouncilCurrentAccount(
      null,
      depositArgs,
      context
    )

    expect(sendBulkSMS).not.toHaveBeenCalled()
  })

  it('W5: auth — assertAccountsAccess requires fishers + church role (no fishers → rejected)', async () => {
    // Note: `isAuth` is mocked as a no-op jest.fn() at the module level, so the
    // ACCOUNTS_CHURCH_ROLES check inside assertAccountsAccess always passes here.
    // The fishers guard is the explicit `if (!roles?.includes('fishers'))` branch
    // after isAuth and is NOT mocked — it runs for real and rejects the call.
    // The symmetric case (fishers-only, no church role) is not exercised because
    // isAuth is mocked; that path belongs in an integration test.
    const noFishers: Context = {
      ...context,
      jwt: { ...mockJwt, roles: ['leaderCouncil'] as any },
    } as unknown as Context

    await expect(
      accountsMutations.DepositIntoCouncilCurrentAccount(null, depositArgs, noFishers)
    ).rejects.toThrow(/fishers role/)

    expect(mockSession.run).not.toHaveBeenCalled()
  })

  it('W5: depositIntoCouncilCurrentAccount Cypher is MERGE-keyed on clientTransactionId (ADR-005 idempotency)', () => {
    expect(depositIntoCouncilCurrentAccount).toMatch(
      /MERGE \(transaction:AccountTransaction \{clientTransactionId: \$clientTransactionId\}\)/
    )
  })

  it('W5: balance update is gated by FOREACH(isNew) — replay does NOT re-increment the council balance', () => {
    // The sentinel + FOREACH pattern ensures the balance mutation only runs
    // once regardless of how many times the same clientTransactionId is retried.
    expect(depositIntoCouncilCurrentAccount).toMatch(
      /FOREACH \(_ IN CASE WHEN isNew THEN \[1\] ELSE \[\] END/
    )
    expect(depositIntoCouncilCurrentAccount).toMatch(
      /SET council\.weekdayBalance = newWeekdayBalance/
    )
  })

  it('W5: balance math — depositIntoCouncilCurrentAccount pre-computes newWeekdayBalance BEFORE the FOREACH', () => {
    // Pre-computing outside the FOREACH is essential: inside a comma-chained SET
    // in Cypher, later items read post-update values. Pre-computing avoids
    // double-counting on first write (important correctness invariant — ADR-005).
    expect(depositIntoCouncilCurrentAccount).toMatch(
      /council\.weekdayBalance \+ \$weekdayBalanceDepositAmount AS newWeekdayBalance/
    )
  })

  it('W5: depositIntoCouncilCurrentAccount RETURN includes isNew so the resolver can gate SMS dispatch', () => {
    expect(depositIntoCouncilCurrentAccount).toMatch(/RETURN.*isNew/)
  })
})

// ===========================================================================
// DepositIntoCouncilBussingSociety
// ===========================================================================
describe('W5 — DepositIntoCouncilBussingSociety: bussing society balance update', () => {
  const bussingDepositArgs = {
    councilId: 'council_1',
    // This is the TARGET balance, not a delta — resolver computes depositAmount = new - old
    bussingSocietyBalance: 500,
    clientTransactionId: 'ctx_buss_1',
  }

  it('W5: happy path — two session.run calls; second uses depositIntoCoucilBussingSociety Cypher', async () => {
    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec({ bussingSocietyBalance: 200 })] })
      .mockResolvedValueOnce({ records: [bussingDepositRec({ isNew: true })] })

    await accountsMutations.DepositIntoCouncilBussingSociety(
      null,
      bussingDepositArgs,
      context
    )

    expect(mockSession.run).toHaveBeenCalledTimes(2)
    expect(mockSession.run.mock.calls[1][0]).toBe(depositIntoCoucilBussingSociety)
  })

  it('W5: resolver computes depositAmount = args.bussingSocietyBalance - council.bussingSocietyBalance (characterised)', async () => {
    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec({ bussingSocietyBalance: 200 })] })
      .mockResolvedValueOnce({ records: [bussingDepositRec({ isNew: true })] })

    await accountsMutations.DepositIntoCouncilBussingSociety(
      null,
      bussingDepositArgs,
      context
    )

    // depositAmount = 500 - 200 = 300; resolver passes that as bussingSocietyDepositAmount
    const depositCall = mockSession.run.mock.calls[1]
    expect(depositCall[1]).toMatchObject({ bussingSocietyDepositAmount: 300 })
  })

  it('W5: negative depositAmount is valid (deduction path) — transactionType set to "Debit"', async () => {
    // depositAmount < 0 when new total < current balance → valid deduction.
    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec({ bussingSocietyBalance: 500 })] })
      .mockResolvedValueOnce({ records: [bussingDepositRec({ isNew: true, bussingSocietyBalance: 100 })] })

    await accountsMutations.DepositIntoCouncilBussingSociety(
      null,
      // Setting new target to 100 when current is 500 → deduction of 400
      { ...bussingDepositArgs, bussingSocietyBalance: 100 },
      context
    )

    const depositCall = mockSession.run.mock.calls[1]
    // Negative deposit amount (400 deducted) and Debit transactionType
    expect(depositCall[1]).toMatchObject({
      bussingSocietyDepositAmount: -400,
      transactionType: 'Debit',
    })
  })

  it('W5: isNew=true → SMS sent; isNew=false → SMS suppressed', async () => {
    // isNew=true → SMS
    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec({ bussingSocietyBalance: 200 })] })
      .mockResolvedValueOnce({ records: [bussingDepositRec({ isNew: true })] })

    await accountsMutations.DepositIntoCouncilBussingSociety(
      null,
      bussingDepositArgs,
      context
    )
    expect(sendBulkSMS).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()

    // isNew=false → no SMS
    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec({ bussingSocietyBalance: 200 })] })
      .mockResolvedValueOnce({ records: [bussingDepositRec({ isNew: false })] })

    await accountsMutations.DepositIntoCouncilBussingSociety(
      null,
      bussingDepositArgs,
      context
    )
    expect(sendBulkSMS).not.toHaveBeenCalled()
  })

  it('W5: depositIntoCoucilBussingSociety Cypher is MERGE-keyed on clientTransactionId (ADR-005)', () => {
    expect(depositIntoCoucilBussingSociety).toMatch(
      /MERGE \(transaction:AccountTransaction \{clientTransactionId: \$clientTransactionId\}\)/
    )
  })

  it('W5: bussing balance update is also FOREACH-gated — replay does not re-mutate council', () => {
    expect(depositIntoCoucilBussingSociety).toMatch(
      /FOREACH \(_ IN CASE WHEN isNew THEN \[1\] ELSE \[\] END/
    )
    expect(depositIntoCoucilBussingSociety).toMatch(
      /SET council\.bussingSocietyBalance = newBussingBalance/
    )
  })
})

// ===========================================================================
// DebitBussingSociety
// ===========================================================================
describe('W5 — DebitBussingSociety: direct bussing society debit', () => {
  const debitArgs = {
    councilId: 'council_1',
    expenseAmount: 150,
    expenseCategory: 'Bussing',
    clientTransactionId: 'ctx_deb_1',
  }

  const debitWriteRec = (isNew: boolean) =>
    rec({
      isNew,
      transaction: {
        properties: {
          id: 'txn_deb_1',
          amount: -150,
          status: 'success',
          account: 'Bussing Society',
          bussingSocietyBalance: 50,
        },
      },
      requester: {
        properties: { id: 'user_admin_1', firstName: 'Test', lastName: 'Admin' },
      },
    })

  it('W5: happy path — getCouncilBalances then debitBussingSociety', async () => {
    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec()] })
      .mockResolvedValueOnce({ records: [debitWriteRec(true)] })

    const result = await accountsMutations.DebitBussingSociety(
      null,
      debitArgs,
      context
    )

    expect(mockSession.run.mock.calls[1][0]).toBe(debitBussingSociety)
    expect(result).toMatchObject({
      id: 'txn_deb_1',
      status: 'success',
    })
  })

  it('W5: isNew=true → SMS sent; isNew=false → no SMS (same pattern as deposits)', async () => {
    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec()] })
      .mockResolvedValueOnce({ records: [debitWriteRec(true)] })

    await accountsMutations.DebitBussingSociety(null, debitArgs, context)
    expect(sendBulkSMS).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()

    mockSession.run
      .mockResolvedValueOnce({ records: [councilRec()] })
      .mockResolvedValueOnce({ records: [debitWriteRec(false)] })

    await accountsMutations.DebitBussingSociety(null, debitArgs, context)
    expect(sendBulkSMS).not.toHaveBeenCalled()
  })

  it('W5: auth — DebitBussingSociety requires fishers + church role', async () => {
    const noFishers: Context = {
      ...context,
      jwt: { ...mockJwt, roles: ['leaderCouncil'] as any },
    } as unknown as Context

    await expect(
      accountsMutations.DebitBussingSociety(null, debitArgs, noFishers)
    ).rejects.toThrow(/fishers role/)

    expect(mockSession.run).not.toHaveBeenCalled()
  })

  it('W5: debitBussingSociety Cypher stores amount as -1 * expenseAmount (negative = debit, per convention)', () => {
    expect(debitBussingSociety).toMatch(
      /transaction\.amount = -1 \* \$expenseAmount/
    )
  })

  it('W5: debitBussingSociety Cypher is MERGE-keyed on clientTransactionId (ADR-005)', () => {
    expect(debitBussingSociety).toMatch(
      /MERGE \(transaction:AccountTransaction \{clientTransactionId: \$clientTransactionId\}\)/
    )
  })
})

// ===========================================================================
// Money invariant — Cypher-level characterisation
// "Sum of deposits minus sum of expenses equals current balance" (SYN-74 §4)
// ===========================================================================
describe('W5 — money invariant: Cypher balance-snapshot pattern', () => {
  it('W5: depositIntoCouncilCurrentAccount snapshots weekdayBalance ON the transaction row (ledger trace)', () => {
    // Each transaction row carries a post-write balance snapshot so that
    // the ledger entries can be audited independently of the live balance.
    expect(depositIntoCouncilCurrentAccount).toMatch(
      /transaction\.weekdayBalance = newWeekdayBalance/
    )
    expect(depositIntoCouncilCurrentAccount).toMatch(
      /transaction\.bussingSocietyBalance = bussingSnapshot/
    )
  })

  it('W5: depositIntoCoucilBussingSociety snapshots both balances on the transaction row', () => {
    expect(depositIntoCoucilBussingSociety).toMatch(
      /transaction\.bussingSocietyBalance = newBussingBalance/
    )
    expect(depositIntoCoucilBussingSociety).toMatch(
      /transaction\.weekdayBalance = weekdaySnapshot/
    )
  })

  it('W5: debitBussingSociety uses the same FOREACH-isNew sentinel so the balance moves only once per clientTransactionId', () => {
    expect(debitBussingSociety).toMatch(
      /FOREACH \(_ IN CASE WHEN isNew THEN \[1\] ELSE \[\] END/
    )
    expect(debitBussingSociety).toMatch(
      /SET council\.bussingSocietyBalance = newBussingBalance/
    )
  })

  it('W5: all deposit / debit Cyphers link the transaction to the council via HAS_TRANSACTION and to the actor via LOGGED_BY', () => {
    for (const cypher of [
      depositIntoCouncilCurrentAccount,
      depositIntoCoucilBussingSociety,
      debitBussingSociety,
    ]) {
      expect(cypher).toMatch(/MERGE \(council\)-\[:HAS_TRANSACTION\]->\(transaction\)/)
      expect(cypher).toMatch(/MERGE.*LOGGED_BY/)
    }
  })
})
