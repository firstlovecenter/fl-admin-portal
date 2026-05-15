/**
 * SM6 — Characterization tests for the account expense request state machine.
 *
 * SM6 (kb/04-state-machines.md):
 *
 *   draft (client) ─▶ pending approval ─┬─▶ success (paid)
 *                                       └─▶ declined
 *
 * Resolvers under test (accounts-resolvers.ts):
 *   - ExpenseRequest      — creates a transaction in 'pending approval'
 *   - ApproveExpense      — pending approval → success (debits weekday;
 *                           Bussing branch also credits Bussing Society)
 *   - DeclineExpense      — pending approval → declined (no balance move)
 *
 * Cypher under test (accounts-cypher.ts):
 *   - createExpenseRequest, approveExpense, approveBussingExpense,
 *     declineExpense
 *
 * Coverage:
 *   - Pending → Approved by gating role debits exactly the request amount
 *   - Pending → Approved for Bussing branch: weekday debit + bussing credit
 *   - Pending → Declined leaves balances untouched
 *   - Double-approve idempotency (status guard at DB layer; resolver maps to a
 *     friendly error and never re-debits)
 *   - Negative balance guard: characterized as "Insufficient Funds" /
 *     "Insufficient bussing funds" thrown BEFORE the write Cypher runs
 *   - Approval auth gating (ACCOUNTS_CHURCH_ROLES + fishers; assertScopeViaTransaction)
 *   - Decline auth gating (narrower: adminCampus + leaderCampus only)
 *   - HistoryLog: characterized (one entry on ExpenseRequest naming the requester;
 *     NONE on Approve / Decline — flagged via it.todo)
 *
 * All test names begin with "SM6:" for grep-ability (SYN-71):
 *   npm test -- accounts-expense-sm6 --testNamePattern="SM6:"
 */

import { accountsMutations } from './accounts-resolvers'
import {
  approveBussingExpense,
  approveExpense,
  createExpenseRequest,
  declineExpense,
  getCouncilBalancesWithTransaction,
  undoBussingTransactionCypher,
  undoWeekdayTransactionCypher,
  getTransactionForUndo,
} from './accounts-cypher'
import type { Context } from '../utils/neo4j-types'
import { isAuth } from '../utils/utils'
import { sendBulkSMS } from '../utils/notify'

jest.mock('../secrets', () => ({
  loadSecrets: jest.fn().mockResolvedValue({
    ENVIRONMENT: 'development',
    MNOTIFY_KEY: 'jest_mnotify_key',
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

// sendBulkSMS is fire-and-forget in ApproveExpense; mock so the test
// doesn't open the real axios call.  Resolves to a benign string.
jest.mock('../utils/notify', () => ({
  sendBulkSMS: jest.fn().mockResolvedValue('Message sent successfully'),
}))

// ---------------------------------------------------------------------------
// Helpers — minimal mock surface that matches the shape `accounts-resolvers.ts`
// asks of the driver: `result.records[i].get(key).properties`.
// ---------------------------------------------------------------------------
type Props = Record<string, unknown>

const propRec = (entities: Record<string, Props>) => ({
  get: (key: string) => ({ properties: entities[key] }),
})

const mockJwt = {
  userId: 'user_admin_1',
  sub: 'user_admin_1',
  // Default to the maximally-permissive role set so the resolver's
  // assertAccountsAccess(...) passes on the happy paths. Individual tests
  // override to exercise role-gate negatives.
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

  // SYN-111 — accounts office-hours gate uses `getUTCHours() in [6, 15)`.
  // ExpenseRequest checks this BEFORE the fishers exemption is read, so
  // running tests at any wall-clock would be flaky. Pin to 10:00 UTC and
  // accept the real exemption-path as a separate test below.
  jest.useFakeTimers().setSystemTime(new Date('2026-05-14T10:00:00Z'))
})

afterEach(() => {
  jest.useRealTimers()
})

// ---------------------------------------------------------------------------
// ExpenseRequest — creates a pending transaction
// ---------------------------------------------------------------------------
describe('SM6 — ExpenseRequest: draft → pending approval', () => {
  const requestArgs = {
    councilId: 'council_1',
    expenseAmount: 500,
    expenseCategory: 'Ministry Expense',
    accountType: 'Weekday Account',
    description: 'Sound system repair',
    clientTransactionId: 'ctx_1',
  }

  it('SM6: creates an AccountTransaction with status="pending approval" via createExpenseRequest Cypher', async () => {
    mockSession.executeRead.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            name: 'Test Council',
            weekdayBalance: 1000,
            bussingSocietyBalance: 200,
            hrAmount: 0,
          },
        }),
      ],
    })
    mockSession.executeWrite.mockResolvedValueOnce({
      records: [
        propRec({
          transaction: {
            id: 'txn_new_1',
            status: 'pending approval',
            amount: -500,
            category: 'Ministry Expense',
          },
          requester: {
            id: 'user_admin_1',
            firstName: 'Test',
            lastName: 'Admin',
          },
        }),
      ],
    })

    const result = await accountsMutations.ExpenseRequest(
      null,
      requestArgs,
      context
    )

    // Cypher hit + write hit
    expect(mockSession.executeRead).toHaveBeenCalledTimes(1)
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)

    // Write was the createExpenseRequest Cypher
    const fakeTx = { run: jest.fn().mockResolvedValue({ records: [] }) }
    const writeCb = mockSession.executeWrite.mock.calls[0][0] as (
      tx: typeof fakeTx
    ) => Promise<unknown>
    writeCb(fakeTx)
    expect(fakeTx.run).toHaveBeenCalledWith(
      createExpenseRequest,
      expect.objectContaining({
        councilId: 'council_1',
        expenseAmount: 500,
        expenseCategory: 'Ministry Expense',
        accountType: 'Weekday Account',
        description: 'Sound system repair',
        clientTransactionId: 'ctx_1',
        jwt: context.jwt,
      })
    )

    expect(result).toMatchObject({
      id: 'txn_new_1',
      status: 'pending approval',
    })
  })

  it('SM6: createExpenseRequest Cypher sets transaction.status = "pending approval"', () => {
    expect(createExpenseRequest).toMatch(
      /transaction\.status = 'pending approval'/
    )
  })

  it('SM6: ExpenseRequest is idempotent — createExpenseRequest MERGE-keys on clientTransactionId (ADR-005)', () => {
    expect(createExpenseRequest).toMatch(
      /MERGE \(transaction:AccountTransaction \{clientTransactionId: \$clientTransactionId\}\)/
    )
  })

  it('SM6: ExpenseRequest auth — assertAccountsAccess requires fishers + a church-scoped role', async () => {
    // Strip the fishers role; the resolver should refuse before any DB hit.
    const noFishers = {
      ...context,
      jwt: { ...mockJwt, roles: ['leaderCouncil'] as const },
    } as Context

    await expect(
      accountsMutations.ExpenseRequest(null, requestArgs, noFishers)
    ).rejects.toThrow(/fishers role/)
    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// ApproveExpense — pending → success, debit weekday by exactly the amount
// ---------------------------------------------------------------------------
describe('SM6 — ApproveExpense: pending → success', () => {
  const approveArgs = { transactionId: 'txn_pending_1', charge: 0 }

  const seedPendingRead = (overrides: Partial<Props> = {}) => {
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            name: 'Test Council',
            weekdayBalance: 1000,
            bussingSocietyBalance: 200,
            ...overrides,
          },
          leader: {
            id: 'leader_1',
            firstName: 'Lead',
            lastName: 'Pastor',
            phoneNumber: '0240000000',
          },
          transaction: {
            id: 'txn_pending_1',
            status: 'pending approval',
            // SM6: amount is stored negative; weekdayBalance -=
            // (-1 * amount) - charge debits by `|amount|`.
            amount: -500,
            category: 'Ministry Expense',
            description: 'Sound system repair',
          },
        }),
      ],
    })
  }

  const seedWriteSuccess = () => {
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          transaction: {
            id: 'txn_pending_1',
            status: 'success',
            amount: -500,
            weekdayBalance: 500,
          },
          depositor: {
            id: 'user_admin_1',
            firstName: 'Test',
            lastName: 'Admin',
          },
        }),
      ],
    })
  }

  it('SM6: approving a pending non-Bussing expense runs approveExpense and returns status=success', async () => {
    seedPendingRead()
    seedWriteSuccess()

    const result = await accountsMutations.ApproveExpense(
      null,
      approveArgs,
      context
    )

    expect(mockSession.run).toHaveBeenCalledTimes(2)
    // 1st: getCouncilBalancesWithTransaction (status-gated read)
    // 2nd: approveExpense (the write that actually flips status + debits)
    expect(mockSession.run.mock.calls[1][0]).toBe(approveExpense)
    expect(mockSession.run.mock.calls[1][1]).toMatchObject({
      transactionId: 'txn_pending_1',
      charge: 0,
    })

    expect(result).toMatchObject({
      id: 'txn_pending_1',
      status: 'success',
    })
  })

  it('SM6: approveExpense Cypher debits weekdayBalance by exactly (-1 * transaction.amount) - charge', () => {
    // SM6: `transaction.amount` is stored negative, so -1 * amount = |amount|.
    expect(approveExpense).toMatch(
      /council\.weekdayBalance = council\.weekdayBalance - \(-1 \* transaction\.amount\) - toFloat\(\$charge\)/
    )
  })

  it('SM6: approving a Bussing expense routes through approveBussingExpense (single Cypher; atomic debit + mirror credit)', async () => {
    // Status-gated read returns the pending Bussing transaction.
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            name: 'Test Council',
            weekdayBalance: 1000,
            bussingSocietyBalance: 200,
          },
          leader: {
            id: 'leader_1',
            firstName: 'Lead',
            lastName: 'Pastor',
            phoneNumber: '0240000000',
          },
          transaction: {
            id: 'txn_pending_1',
            status: 'pending approval',
            amount: -300,
            category: 'Bussing',
            description: 'Bussing expense',
          },
        }),
      ],
    })
    // approveBussingExpense write success.
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          transaction: {
            id: 'txn_pending_1',
            status: 'success',
            amount: -300,
          },
          depositor: {
            id: 'user_admin_1',
            firstName: 'Test',
            lastName: 'Admin',
          },
        }),
      ],
    })

    const result = await accountsMutations.ApproveExpense(
      null,
      approveArgs,
      context
    )

    expect(mockSession.run.mock.calls[1][0]).toBe(approveBussingExpense)
    expect(result).toMatchObject({ id: 'txn_pending_1', status: 'success' })
  })

  it('SM6: approveBussingExpense Cypher writes BOTH the debit and the mirror credit-leg in a single statement (SYN-94)', () => {
    // Single Cypher string, parent debit + credit-leg MERGE in one shot.
    expect(approveBussingExpense).toMatch(
      /council\.bussingSocietyBalance = council\.bussingSocietyBalance \+ \(-1 \* transaction\.amount\)/
    )
    expect(approveBussingExpense).toMatch(
      /council\.weekdayBalance = council\.weekdayBalance - \(-1 \* transaction\.amount\) - toFloat\(\$charge\)/
    )
    expect(approveBussingExpense).toMatch(
      /'internal:credit-leg:' \+ \$transactionId AS creditLegKey/
    )
    expect(approveBussingExpense).toMatch(
      /MERGE \(creditLeg:AccountTransaction \{clientTransactionId: creditLegKey\}\)/
    )
  })

  it('SM6: approveExpense Cypher is status-gated to "pending approval" — DB layer enforces single-debit', () => {
    expect(approveExpense).toMatch(
      /WHERE transaction\.status = 'pending approval'/
    )
  })

  it('SM6: approveBussingExpense Cypher is status-gated to "pending approval"', () => {
    expect(approveBussingExpense).toMatch(
      /WHERE transaction\.status = 'pending approval'/
    )
  })
})

// ---------------------------------------------------------------------------
// ApproveExpense — idempotency / double-approval (ADR-005, SYN-92)
// ---------------------------------------------------------------------------
describe('SM6 — ApproveExpense: double-approval does not double-debit', () => {
  const approveArgs = { transactionId: 'txn_pending_1', charge: 0 }

  it('SM6: a second approve where the read returns zero rows surfaces "no longer pending" — never touches balance', async () => {
    // Status-gated read returns zero rows on the second pass (status is
    // already 'success' from the first approve). Resolver must bail BEFORE
    // running the write Cypher.
    mockSession.run.mockResolvedValueOnce({ records: [] })

    await expect(
      accountsMutations.ApproveExpense(null, approveArgs, context)
    ).rejects.toThrow(/no longer pending approval/)

    // Only the read fired; the write was never reached.
    expect(mockSession.run).toHaveBeenCalledTimes(1)
  })

  it('SM6: read succeeds (TOCTOU window) but write returns zero rows AND status changed — surfaces "no longer pending"', async () => {
    // Read passes (concurrent writer hasn't flipped status yet) but the
    // write loses the race and matches zero rows. SYN-120: resolver now
    // fires a diagnostic read against the status-gated query to tell
    // status-loss and solvency-loss apart. Diagnostic returning zero
    // rows means the row is no longer pending → status TOCTOU.
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            name: 'Test Council',
            weekdayBalance: 1000,
            bussingSocietyBalance: 200,
          },
          leader: {
            id: 'leader_1',
            firstName: 'Lead',
            lastName: 'Pastor',
            phoneNumber: '0240000000',
          },
          transaction: {
            id: 'txn_pending_1',
            status: 'pending approval',
            amount: -500,
            category: 'Ministry Expense',
          },
        }),
      ],
    })
    mockSession.run.mockResolvedValueOnce({ records: [] })
    mockSession.run.mockResolvedValueOnce({ records: [] })

    await expect(
      accountsMutations.ApproveExpense(null, approveArgs, context)
    ).rejects.toThrow(/no longer pending approval/)

    expect(mockSession.run).toHaveBeenCalledTimes(3)
    // SYN-120: third call is the status-gated diagnostic; locks future
    // refactors out of accidentally swapping in getCouncilBalances
    // (which is NOT status-gated and would mis-classify the error).
    expect(mockSession.run.mock.calls[2][0]).toBe(
      getCouncilBalancesWithTransaction
    )
    // SMS dispatch is fire-and-forget AFTER the zero-row check, so it
    // must not have been called on the loser side.
    expect(sendBulkSMS).not.toHaveBeenCalled()
  })

  it('SM6: SYN-120 — read passes, write returns zero rows BUT status still pending → surfaces "Insufficient weekday funds"', async () => {
    // TOCTOU on solvency: a competing approval in the gap between read
    // and write debits enough to take the council below this expense's
    // amount. The Cypher's WHERE rejects on solvency; the diagnostic
    // read confirms the row is still pending → solvency must have
    // tripped → user-facing "Insufficient weekday funds" message.
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            name: 'Test Council',
            weekdayBalance: 1000,
            bussingSocietyBalance: 200,
          },
          leader: {
            id: 'leader_1',
            firstName: 'Lead',
            lastName: 'Pastor',
            phoneNumber: '0240000000',
          },
          transaction: {
            id: 'txn_pending_1',
            status: 'pending approval',
            amount: -500,
            category: 'Ministry Expense',
          },
        }),
      ],
    })
    mockSession.run.mockResolvedValueOnce({ records: [] })
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            name: 'Test Council',
            weekdayBalance: 100,
            bussingSocietyBalance: 200,
          },
          leader: {
            id: 'leader_1',
            firstName: 'Lead',
            lastName: 'Pastor',
            phoneNumber: '0240000000',
          },
          transaction: {
            id: 'txn_pending_1',
            status: 'pending approval',
            amount: -500,
            category: 'Ministry Expense',
          },
        }),
      ],
    })

    await expect(
      accountsMutations.ApproveExpense(null, approveArgs, context)
    ).rejects.toThrow(/Insufficient weekday funds/)

    expect(mockSession.run).toHaveBeenCalledTimes(3)
    expect(mockSession.run.mock.calls[2][0]).toBe(
      getCouncilBalancesWithTransaction
    )
    expect(sendBulkSMS).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// ApproveExpense — negative-balance guard (SYN-120: now in JS AND Cypher)
// ---------------------------------------------------------------------------
describe('SM6 — ApproveExpense: negative-balance guard', () => {
  const approveArgs = { transactionId: 'txn_pending_1', charge: 0 }

  it('SM6: non-Bussing — when weekdayBalance < |amount|, throws "Insufficient weekday funds" BEFORE the write Cypher', async () => {
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            name: 'Test Council',
            // weekdayBalance < |transaction.amount| = 500 triggers the
            // guard.
            weekdayBalance: 100,
            bussingSocietyBalance: 200,
          },
          leader: {
            id: 'leader_1',
            firstName: 'Lead',
            lastName: 'Pastor',
            phoneNumber: '0240000000',
          },
          transaction: {
            id: 'txn_pending_1',
            status: 'pending approval',
            amount: -500,
            category: 'Ministry Expense',
          },
        }),
      ],
    })

    await expect(
      accountsMutations.ApproveExpense(null, approveArgs, context)
    ).rejects.toThrow(/Insufficient weekday funds/)

    // Only the read fired; write skipped.
    expect(mockSession.run).toHaveBeenCalledTimes(1)
  })

  it('SM6: Bussing — when weekdayBalance < |amount|, throws "Insufficient weekday funds" BEFORE the write Cypher (SYN-120 — message corrected; the source-of-funds is weekday, not bussing)', async () => {
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            name: 'Test Council',
            // The Bussing branch gates on `council.weekdayBalance <
            // transactionAmount + charge`, NOT on bussingSocietyBalance
            // — because the Bussing-category expense debits weekday and
            // credits bussing society. The check guards the source-of-
            // funds (weekday), not the destination (bussing).
            weekdayBalance: 100,
            bussingSocietyBalance: 200,
          },
          leader: {
            id: 'leader_1',
            firstName: 'Lead',
            lastName: 'Pastor',
            phoneNumber: '0240000000',
          },
          transaction: {
            id: 'txn_pending_1',
            status: 'pending approval',
            amount: -500,
            category: 'Bussing',
          },
        }),
      ],
    })

    await expect(
      accountsMutations.ApproveExpense(null, approveArgs, context)
    ).rejects.toThrow(/Insufficient weekday funds/)

    expect(mockSession.run).toHaveBeenCalledTimes(1)
  })

  it('SM6: SYN-120 — JS guard rejects when weekdayBalance < |amount| + charge (off-by-charge gap closed)', async () => {
    // Pre-fix: JS guard ignored args.charge, so weekdayBalance == |amount|
    // with charge > 0 passed JS and the post-state landed at -charge.
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            name: 'Test Council',
            weekdayBalance: 500,
            bussingSocietyBalance: 200,
          },
          leader: {
            id: 'leader_1',
            firstName: 'Lead',
            lastName: 'Pastor',
            phoneNumber: '0240000000',
          },
          transaction: {
            id: 'txn_pending_1',
            status: 'pending approval',
            amount: -500,
            category: 'Ministry Expense',
          },
        }),
      ],
    })

    await expect(
      accountsMutations.ApproveExpense(
        null,
        { transactionId: 'txn_pending_1', charge: 50 },
        context
      )
    ).rejects.toThrow(/Insufficient weekday funds/)

    expect(mockSession.run).toHaveBeenCalledTimes(1)
  })

  it('SM6: SYN-120 — JS guard ACCEPTS the boundary case weekdayBalance == |amount| + charge (proves threshold is exact)', async () => {
    // Boundary check: with weekdayBalance = 550, |amount| = 500, charge = 50,
    // post-state = 0 (non-negative). Guard must permit this case so that the
    // threshold is correctly `< |amount| + charge`, not `<= |amount| + charge`.
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            name: 'Test Council',
            weekdayBalance: 550,
            bussingSocietyBalance: 200,
          },
          leader: {
            id: 'leader_1',
            firstName: 'Lead',
            lastName: 'Pastor',
            phoneNumber: '0240000000',
          },
          transaction: {
            id: 'txn_pending_1',
            status: 'pending approval',
            amount: -500,
            category: 'Ministry Expense',
          },
        }),
      ],
    })
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          transaction: {
            id: 'txn_pending_1',
            status: 'success',
            amount: -500,
            weekdayBalance: 0,
          },
          depositor: {
            id: 'user_admin_1',
            firstName: 'Test',
            lastName: 'Admin',
          },
        }),
      ],
    })

    const result = await accountsMutations.ApproveExpense(
      null,
      { transactionId: 'txn_pending_1', charge: 50 },
      context
    )

    expect(result).toMatchObject({ id: 'txn_pending_1', status: 'success' })
    // Read + write — no diagnostic, no extra calls.
    expect(mockSession.run).toHaveBeenCalledTimes(2)
  })

  // SYN-120 — the negative-balance guard is now enforced atomically in
  // the write Cypher's WHERE clause as well, closing the TOCTOU window
  // where a concurrent approver could pass the JS check but still drive
  // the council into a negative weekdayBalance between read and write.
  it('SM6: SYN-120 — approveExpense Cypher re-checks solvency atomically in its WHERE', () => {
    expect(approveExpense).toMatch(
      /AND council\.weekdayBalance >= \(-1 \* transaction\.amount\) \+ toFloat\(\$charge\)/
    )
  })

  it('SM6: SYN-120 — approveBussingExpense Cypher re-checks solvency atomically in its WHERE', () => {
    expect(approveBussingExpense).toMatch(
      /AND council\.weekdayBalance >= \(-1 \* transaction\.amount\) \+ toFloat\(\$charge\)/
    )
  })
})

// ---------------------------------------------------------------------------
// DeclineExpense — pending → declined, no balance change
// ---------------------------------------------------------------------------
describe('SM6 — DeclineExpense: pending → declined', () => {
  const declineArgs = { transactionId: 'txn_pending_1' }

  beforeEach(() => {
    // Build a fresh context with a narrowed role set; mutating the shared
    // `mockJwt` would leak into later describes.
    context = {
      ...context,
      jwt: { ...mockJwt, roles: ['adminCampus'] as const },
    } as Context
  })

  it('SM6: declines via declineExpense Cypher and returns the transaction with status="declined"', async () => {
    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          transaction: {
            id: 'txn_pending_1',
            status: 'declined',
            amount: -500,
          },
        }),
      ],
    })

    const result = await accountsMutations.DeclineExpense(
      null,
      declineArgs,
      context
    )

    expect(mockSession.run).toHaveBeenCalledWith(declineExpense, declineArgs)
    expect(result).toMatchObject({ status: 'declined' })
  })

  it('SM6: declineExpense Cypher status-gates to "pending approval" — no silent re-flip of an already-approved row', () => {
    expect(declineExpense).toMatch(
      /WHERE transaction\.status = 'pending approval'/
    )
  })

  it('SM6: declineExpense Cypher does NOT touch council.weekdayBalance or council.bussingSocietyBalance — declining leaves balances alone', () => {
    expect(declineExpense).not.toMatch(/council\.weekdayBalance/)
    expect(declineExpense).not.toMatch(/council\.bussingSocietyBalance/)
  })

  it('SM6: declining an already-approved/declined transaction returns zero rows — resolver surfaces "no longer pending"', async () => {
    mockSession.run.mockResolvedValueOnce({ records: [] })

    await expect(
      accountsMutations.DeclineExpense(null, declineArgs, context)
    ).rejects.toThrow(/no longer pending approval/)
  })
})

// ---------------------------------------------------------------------------
// Approval / decline auth gates — characterise the role matrix
// ---------------------------------------------------------------------------
describe('SM6 — Auth: who can approve and who can decline', () => {
  it('SM6: ApproveExpense calls isAuth with the three church-scoped roles (leaderCouncil, leaderCampus, adminCampus)', async () => {
    mockSession.run.mockResolvedValueOnce({ records: [] })

    await accountsMutations
      .ApproveExpense(
        null,
        { transactionId: 'txn_pending_1', charge: 0 },
        context
      )
      .catch(() => {
        /* zero-rows path; we only care that isAuth was called */
      })

    expect(isAuth).toHaveBeenCalledWith(
      expect.arrayContaining(['leaderCouncil', 'leaderCampus', 'adminCampus']),
      context.jwt.roles
    )
  })

  it('SM6: ApproveExpense requires the fishers role IN ADDITION to a church-scoped role', async () => {
    const noFishers = {
      ...context,
      jwt: { ...mockJwt, roles: ['leaderCouncil'] as const },
    } as Context

    await expect(
      accountsMutations.ApproveExpense(
        null,
        { transactionId: 'txn_pending_1', charge: 0 },
        noFishers
      )
    ).rejects.toThrow(/fishers role/)
    expect(mockSession.run).not.toHaveBeenCalled()
  })

  it('SM6: ApproveExpense is blocked when isAuth rejects (non-accounts role)', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('You are not permitted to run this mutation')
    })

    await expect(
      accountsMutations.ApproveExpense(
        null,
        { transactionId: 'txn_pending_1', charge: 0 },
        context
      )
    ).rejects.toThrow(/not permitted/)
  })

  it('SM6: DeclineExpense gate is NARROWER — adminCampus + leaderCampus only, NOT leaderCouncil (SYN-96 preserved)', async () => {
    // Build the expected role set from the resolver source-of-truth
    // exposure: the DeclineExpense gate intentionally omits leaderCouncil.
    mockSession.run.mockResolvedValueOnce({ records: [] })

    await accountsMutations
      .DeclineExpense(null, { transactionId: 'txn_pending_1' }, context)
      .catch(() => {
        /* zero-rows path; we only care that isAuth was called */
      })

    // Positive: adminCampus and leaderCampus must be in the list.
    expect(isAuth).toHaveBeenCalledWith(
      expect.arrayContaining(['adminCampus', 'leaderCampus']),
      context.jwt.roles
    )
    // Negative: leaderCouncil MUST NOT be in the DeclineExpense role list.
    const [passedRoles] = (isAuth as jest.Mock).mock.calls[0]
    expect(passedRoles).not.toContain('leaderCouncil')
  })

  it('SM6: DeclineExpense does NOT require fishers — confirmed by the narrower SYN-96 gate (no assertAccountsAccess)', async () => {
    // The decline path uses the narrow DECLINE_EXPENSE_ROLES list directly,
    // not assertAccountsAccess. A caller with adminCampus but NO fishers
    // should pass the gate; the write Cypher is what determines the
    // ultimate outcome.
    const adminNoFishers = {
      ...context,
      jwt: { ...mockJwt, roles: ['adminCampus'] as const },
    } as Context

    mockSession.run.mockResolvedValueOnce({
      records: [
        propRec({
          transaction: {
            id: 'txn_pending_1',
            status: 'declined',
            amount: -500,
          },
        }),
      ],
    })

    const result = await accountsMutations.DeclineExpense(
      null,
      { transactionId: 'txn_pending_1' },
      adminNoFishers
    )

    expect(result).toMatchObject({ status: 'declined' })
  })
})

// ---------------------------------------------------------------------------
// HistoryLog characterisation — what the SM6 ticket asked for vs. reality
// ---------------------------------------------------------------------------
describe('SM6 — HistoryLog characterisation: append-on-state-change reality check', () => {
  it('SM6: createExpenseRequest appends a HistoryLog naming the requester (only on first MERGE)', () => {
    // FOREACH gates the HistoryLog write on isNew (first MERGE only) so a
    // retry under the same clientTransactionId does NOT append a second log.
    expect(createExpenseRequest).toMatch(/CREATE \(log:HistoryLog/)
    expect(createExpenseRequest).toMatch(
      /requester\.firstName \+ ' ' \+ requester\.lastName/
    )
    expect(createExpenseRequest).toMatch(
      /FOREACH \(_ IN CASE WHEN isNew THEN \[1\] ELSE \[\] END/
    )
  })

  // TODO(refactor): SM6 ticket says "HistoryLog: one entry per state change,
  // naming the actor". Today the only state transition that writes a
  // HistoryLog is draft → pending approval (in createExpenseRequest).
  // The pending → success and pending → declined transitions write the
  // status flip onto the AccountTransaction node (with `lastModified`)
  // but DO NOT create a :HistoryLog node naming the approver/decliner.
  // UndoBussingTransaction and UndoWeekdayTransaction DO create logs.
  // The asymmetry is recorded here for SYN-71's refactor scope; do NOT
  // fix in this test PR.
  it('SM6: approveExpense Cypher does NOT create a HistoryLog (latent gap; ticket asks for one)', () => {
    expect(approveExpense).not.toMatch(/CREATE \(log:HistoryLog/)
  })

  it('SM6: approveBussingExpense Cypher does NOT create a HistoryLog (latent gap; ticket asks for one)', () => {
    expect(approveBussingExpense).not.toMatch(/CREATE \(log:HistoryLog/)
  })

  it('SM6: declineExpense Cypher does NOT create a HistoryLog (latent gap; ticket asks for one)', () => {
    expect(declineExpense).not.toMatch(/CREATE \(log:HistoryLog/)
  })

  it.todo(
    'SM6 TODO: ApproveExpense should append a HistoryLog naming the approver (per SYN-71 done-when criteria)'
  )

  it.todo(
    'SM6 TODO: DeclineExpense should append a HistoryLog naming the decliner (per SYN-71 done-when criteria)'
  )
})

// ---------------------------------------------------------------------------
// ExpenseRequest — input validation (SYN-87)
// Allow-lists, HR enforcement, description, office-hours gate.
// These guards all fire BEFORE the council read, so executeRead must not
// be called on the rejection paths.
// ---------------------------------------------------------------------------
describe('SM6 — ExpenseRequest: input validation (SYN-87)', () => {
  const baseArgs = {
    councilId: 'council_1',
    expenseAmount: 500,
    expenseCategory: 'Ministry Expense',
    accountType: 'Weekday Account',
    description: 'Sound system repair',
    clientTransactionId: 'ctx_val_1',
  }

  it('SM6: invalid accountType is rejected before any DB call', async () => {
    await expect(
      accountsMutations.ExpenseRequest(
        null,
        { ...baseArgs, accountType: 'Slush Fund' },
        context
      )
    ).rejects.toThrow(/Invalid accountType/)
    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: invalid expenseCategory is rejected before any DB call', async () => {
    await expect(
      accountsMutations.ExpenseRequest(
        null,
        { ...baseArgs, expenseCategory: 'Vacation' },
        context
      )
    ).rejects.toThrow(/Invalid expenseCategory/)
    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: whitespace-only description is rejected before any DB call', async () => {
    await expect(
      accountsMutations.ExpenseRequest(
        null,
        { ...baseArgs, description: '   ' },
        context
      )
    ).rejects.toThrow(/Description is required/)
    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: description >500 chars is rejected before any DB call', async () => {
    await expect(
      accountsMutations.ExpenseRequest(
        null,
        { ...baseArgs, description: 'a'.repeat(501) },
        context
      )
    ).rejects.toThrow(/500 characters/)
    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  // SM6 structural invariant (SYN-111): assertAccountsAccess requires fishers
  // unconditionally, and assertAccountsWindowOpen skips the check when fishers
  // is present. Therefore the time gate is structurally unreachable through this
  // mutation — any caller who passes assertAccountsAccess holds fishers, which
  // bypasses the gate. This test documents the auth-wall ordering as an invariant,
  // not a transient gap.
  it('SM6: a user without fishers hits the auth wall before the time gate (SYN-111 characterisation)', async () => {
    jest.setSystemTime(new Date('2026-05-14T16:00:00Z'))
    const noFishers = {
      ...context,
      jwt: { ...mockJwt, roles: ['leaderCouncil'] as const },
    } as Context

    await expect(
      accountsMutations.ExpenseRequest(null, baseArgs, noFishers)
    ).rejects.toThrow(/fishers role/)
    expect(mockSession.executeRead).not.toHaveBeenCalled()
  })

  it('SM6: fishers role bypasses the office-hours gate', async () => {
    jest.setSystemTime(new Date('2026-05-14T16:00:00Z'))
    // context already carries fishers; DB reads/writes respond with happy-path data
    mockSession.executeRead.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            weekdayBalance: 1000,
            bussingSocietyBalance: 200,
            hrAmount: 0,
          },
        }),
      ],
    })
    mockSession.executeWrite.mockResolvedValueOnce({
      records: [
        propRec({
          transaction: {
            id: 'txn_fish_1',
            status: 'pending approval',
            amount: -500,
          },
          requester: {
            id: 'user_admin_1',
            firstName: 'Test',
            lastName: 'Admin',
          },
        }),
      ],
    })

    const result = await accountsMutations.ExpenseRequest(
      null,
      baseArgs,
      context
    )
    expect(result).toMatchObject({ status: 'pending approval' })
  })

  it('SM6: HR category — rejects when council.hrAmount is 0 (no HR amount on file)', async () => {
    mockSession.executeRead.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            weekdayBalance: 1000,
            bussingSocietyBalance: 200,
            hrAmount: 0,
          },
        }),
      ],
    })

    await expect(
      accountsMutations.ExpenseRequest(
        null,
        { ...baseArgs, expenseCategory: 'HR', expenseAmount: 500 },
        context
      )
    ).rejects.toThrow(/no HR amount on file/)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: HR category — rejects when expenseAmount does not equal council.hrAmount', async () => {
    mockSession.executeRead.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            weekdayBalance: 1000,
            bussingSocietyBalance: 200,
            hrAmount: 300,
          },
        }),
      ],
    })

    await expect(
      accountsMutations.ExpenseRequest(
        null,
        { ...baseArgs, expenseCategory: 'HR', expenseAmount: 999 },
        context
      )
    ).rejects.toThrow(/HR expense amount must equal/)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: expenseAmount = 0 is rejected before any DB call (assertPositiveFiniteAmount, allowZero not set)', async () => {
    await expect(
      accountsMutations.ExpenseRequest(
        null,
        { ...baseArgs, expenseAmount: 0 },
        context
      )
    ).rejects.toThrow()
    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// UndoBussingTransaction (SYN-87)
// status guard, category guard, not-found, concurrent-undo idempotency, auth
// ---------------------------------------------------------------------------
describe('SM6 — UndoBussingTransaction: success → undone', () => {
  const undoArgs = { transactionId: 'txn_buss_ok' }

  const seedSuccessfulBussingRead = (overrides: Partial<Props> = {}) => {
    mockSession.executeRead.mockResolvedValueOnce({
      records: [
        propRec({
          transaction: {
            id: 'txn_buss_ok',
            status: 'success',
            category: 'Bussing',
            amount: -300,
            charge: 0,
            ...overrides,
          },
          council: { id: 'council_1' },
        }),
      ],
    })
  }

  it('SM6: happy path — returns council after reverting both balances', async () => {
    seedSuccessfulBussingRead()
    mockSession.executeWrite.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            weekdayBalance: 700,
            bussingSocietyBalance: 500,
          },
        }),
      ],
    })

    const result = await accountsMutations.UndoBussingTransaction(
      null,
      undoArgs,
      context
    )

    expect(mockSession.executeRead).toHaveBeenCalledTimes(1)
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ id: 'council_1' })
  })

  it('SM6: UndoBussingTransaction uses undoBussingTransactionCypher for the write', async () => {
    seedSuccessfulBussingRead()
    mockSession.executeWrite.mockResolvedValueOnce({
      records: [propRec({ council: { id: 'council_1' } })],
    })

    await accountsMutations.UndoBussingTransaction(null, undoArgs, context)

    const fakeTx = { run: jest.fn().mockResolvedValue({ records: [] }) }
    const writeCb = mockSession.executeWrite.mock.calls[0][0] as (
      tx: typeof fakeTx
    ) => Promise<unknown>
    writeCb(fakeTx)
    expect(fakeTx.run).toHaveBeenCalledWith(
      undoBussingTransactionCypher,
      expect.objectContaining({
        transactionId: 'txn_buss_ok',
        jwt: context.jwt,
      })
    )
  })

  it('SM6: rejects when transaction status is not "success"', async () => {
    seedSuccessfulBussingRead({ status: 'pending approval' })

    await expect(
      accountsMutations.UndoBussingTransaction(null, undoArgs, context)
    ).rejects.toThrow(/Only successful transactions can be undone/)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: rejects when category is not "Bussing" — routes user to UndoWeekdayTransaction', async () => {
    seedSuccessfulBussingRead({ category: 'HR' })

    await expect(
      accountsMutations.UndoBussingTransaction(null, undoArgs, context)
    ).rejects.toThrow(/UndoWeekdayTransaction/)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: category guard fires before status guard — non-Bussing + non-success throws category error', async () => {
    seedSuccessfulBussingRead({
      category: 'Ministry Expense',
      status: 'declined',
    })

    await expect(
      accountsMutations.UndoBussingTransaction(null, undoArgs, context)
    ).rejects.toThrow(/UndoWeekdayTransaction/)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: rejects when transaction is not found (no records from read)', async () => {
    mockSession.executeRead.mockResolvedValueOnce({ records: [] })

    await expect(
      accountsMutations.UndoBussingTransaction(null, undoArgs, context)
    ).rejects.toThrow(/Transaction not found or already undone/)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: concurrent undo — write returns zero rows → surfaces "already undone"', async () => {
    seedSuccessfulBussingRead()
    mockSession.executeWrite.mockResolvedValueOnce({ records: [] })

    await expect(
      accountsMutations.UndoBussingTransaction(null, undoArgs, context)
    ).rejects.toThrow(/already undone/)
  })

  it('SM6: auth — requires fishers + church-scoped role', async () => {
    const noFishers = {
      ...context,
      jwt: { ...mockJwt, roles: ['leaderCouncil'] as const },
    } as Context

    await expect(
      accountsMutations.UndoBussingTransaction(null, undoArgs, noFishers)
    ).rejects.toThrow(/fishers role/)
    expect(mockSession.executeRead).not.toHaveBeenCalled()
  })

  it('SM6: undoBussingTransactionCypher is status-gated to "success" AND category "Bussing"', () => {
    expect(undoBussingTransactionCypher).toMatch(
      /WHERE transaction\.status = 'success'/
    )
    expect(undoBussingTransactionCypher).toMatch(
      /AND transaction\.category = 'Bussing'/
    )
  })

  it('SM6: undoBussingTransactionCypher creates a HistoryLog naming the actor', () => {
    expect(undoBussingTransactionCypher).toMatch(/CREATE \(log:HistoryLog/)
    expect(undoBussingTransactionCypher).toMatch(
      /actor\.firstName \+ ' ' \+ actor\.lastName/
    )
    expect(undoBussingTransactionCypher).toMatch(
      /MERGE \(log\)-\[:LOGGED_BY\]->\(actor\)/
    )
  })

  it('SM6: undoBussingTransactionCypher reverses bussingSocietyBalance and weekdayBalance', () => {
    // originalAmount = transaction.amount, stored as a negative number (e.g. -300).
    // bussingSociety + originalAmount → debits bussing (reverses the approval credit).
    // weekdayBalance - originalAmount → credits weekday (reverses the approval debit).
    expect(undoBussingTransactionCypher).toMatch(
      /council\.bussingSocietyBalance = council\.bussingSocietyBalance \+ originalAmount/
    )
    expect(undoBussingTransactionCypher).toMatch(
      /council\.weekdayBalance = council\.weekdayBalance - originalAmount - originalCharge/
    )
  })

  it('SM6: undoBussingTransactionCypher DETACH DELETEs the transaction and its mirror deposit', () => {
    expect(undoBussingTransactionCypher).toMatch(
      /DETACH DELETE mirror, transaction/
    )
  })

  it('SM6: getTransactionForUndo Cypher fetches by transactionId and returns transaction + council', () => {
    expect(getTransactionForUndo).toMatch(/\$transactionId/)
    expect(getTransactionForUndo).toMatch(/RETURN transaction, council/)
  })
})

// ---------------------------------------------------------------------------
// UndoWeekdayTransaction (SYN-87)
// Mirrors UndoBussingTransaction but for non-Bussing categories.
// ---------------------------------------------------------------------------
describe('SM6 — UndoWeekdayTransaction: success → undone', () => {
  const undoArgs = { transactionId: 'txn_wd_ok' }

  const seedSuccessfulWeekdayRead = (overrides: Partial<Props> = {}) => {
    mockSession.executeRead.mockResolvedValueOnce({
      records: [
        propRec({
          transaction: {
            id: 'txn_wd_ok',
            status: 'success',
            category: 'Construction',
            amount: -500,
            charge: 0,
            ...overrides,
          },
          council: { id: 'council_1' },
        }),
      ],
    })
  }

  it('SM6: happy path — returns council after reversing weekday balance', async () => {
    seedSuccessfulWeekdayRead()
    mockSession.executeWrite.mockResolvedValueOnce({
      records: [
        propRec({
          council: {
            id: 'council_1',
            weekdayBalance: 1500,
            bussingSocietyBalance: 200,
          },
        }),
      ],
    })

    const result = await accountsMutations.UndoWeekdayTransaction(
      null,
      undoArgs,
      context
    )

    expect(mockSession.executeRead).toHaveBeenCalledTimes(1)
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ id: 'council_1' })
  })

  it('SM6: UndoWeekdayTransaction uses undoWeekdayTransactionCypher for the write', async () => {
    seedSuccessfulWeekdayRead()
    mockSession.executeWrite.mockResolvedValueOnce({
      records: [propRec({ council: { id: 'council_1' } })],
    })

    await accountsMutations.UndoWeekdayTransaction(null, undoArgs, context)

    const fakeTx = { run: jest.fn().mockResolvedValue({ records: [] }) }
    const writeCb = mockSession.executeWrite.mock.calls[0][0] as (
      tx: typeof fakeTx
    ) => Promise<unknown>
    writeCb(fakeTx)
    expect(fakeTx.run).toHaveBeenCalledWith(
      undoWeekdayTransactionCypher,
      expect.objectContaining({ transactionId: 'txn_wd_ok', jwt: context.jwt })
    )
  })

  it('SM6: rejects when transaction status is not "success"', async () => {
    seedSuccessfulWeekdayRead({ status: 'declined' })

    await expect(
      accountsMutations.UndoWeekdayTransaction(null, undoArgs, context)
    ).rejects.toThrow(/Only successful transactions can be undone/)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: rejects when category is "Bussing" — routes user to UndoBussingTransaction', async () => {
    seedSuccessfulWeekdayRead({ category: 'Bussing' })

    await expect(
      accountsMutations.UndoWeekdayTransaction(null, undoArgs, context)
    ).rejects.toThrow(/UndoBussingTransaction/)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: rejects when transaction is not found (no records from read)', async () => {
    mockSession.executeRead.mockResolvedValueOnce({ records: [] })

    await expect(
      accountsMutations.UndoWeekdayTransaction(null, undoArgs, context)
    ).rejects.toThrow(/Transaction not found or already undone/)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM6: concurrent undo — write returns zero rows → surfaces "already undone"', async () => {
    seedSuccessfulWeekdayRead()
    mockSession.executeWrite.mockResolvedValueOnce({ records: [] })

    await expect(
      accountsMutations.UndoWeekdayTransaction(null, undoArgs, context)
    ).rejects.toThrow(/already undone/)
  })

  it('SM6: auth — requires fishers + church-scoped role', async () => {
    const noFishers = {
      ...context,
      jwt: { ...mockJwt, roles: ['leaderCouncil'] as const },
    } as Context

    await expect(
      accountsMutations.UndoWeekdayTransaction(null, undoArgs, noFishers)
    ).rejects.toThrow(/fishers role/)
    expect(mockSession.executeRead).not.toHaveBeenCalled()
  })

  it('SM6: undoWeekdayTransactionCypher is status-gated to "success" AND category <> "Bussing"', () => {
    expect(undoWeekdayTransactionCypher).toMatch(
      /WHERE transaction\.status = 'success'/
    )
    expect(undoWeekdayTransactionCypher).toMatch(
      /AND transaction\.category <> 'Bussing'/
    )
  })

  it('SM6: undoWeekdayTransactionCypher creates a HistoryLog naming the actor', () => {
    expect(undoWeekdayTransactionCypher).toMatch(/CREATE \(log:HistoryLog/)
    expect(undoWeekdayTransactionCypher).toMatch(
      /actor\.firstName \+ ' ' \+ actor\.lastName/
    )
    expect(undoWeekdayTransactionCypher).toMatch(
      /MERGE \(log\)-\[:LOGGED_BY\]->\(actor\)/
    )
  })

  it('SM6: undoWeekdayTransactionCypher reverses weekdayBalance only (single-sided debit)', () => {
    // originalAmount is stored negative; weekdayBalance - originalAmount credits weekday
    // back (reverses the original debit). bussingSocietyBalance is untouched — no mirror.
    expect(undoWeekdayTransactionCypher).toMatch(
      /council\.weekdayBalance = council\.weekdayBalance - originalAmount - originalCharge/
    )
    expect(undoWeekdayTransactionCypher).not.toMatch(/bussingSocietyBalance/)
  })

  it('SM6: undoWeekdayTransactionCypher DETACH DELETEs the transaction (no mirror deposit)', () => {
    expect(undoWeekdayTransactionCypher).toMatch(/DETACH DELETE transaction/)
    expect(undoWeekdayTransactionCypher).not.toMatch(/DETACH DELETE mirror/)
  })
})
