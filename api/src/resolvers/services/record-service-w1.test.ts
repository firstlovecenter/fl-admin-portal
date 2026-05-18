/**
 * W1 — Characterization tests for `RecordService` in service-resolvers.ts
 *
 * W1 (kb/03-workflows.md) — Record a Bacenta service: write the ServiceRecord,
 * compute the cedi totals, fold in any pending Paystack online giving via
 * `absorbAllTransactions`, then recompute the immediate parent aggregate.
 * ADR-005 (financial idempotency) and ADR-014 (weekly aggregate keying) name
 * this as priority-for-tests territory.
 *
 * These tests pin the OBSERVABLE behavior of the resolver against the current
 * code. Where the resolver's behavior diverges from the KB or an ADR, the
 * divergence is captured as a `TODO(refactor):` comment and the test asserts
 * what the code does, not what it should do (ADR-013 §3.1).
 *
 * Mock approach mirrors `service-vacation.test.ts` and `banking-sm2.test.ts`:
 *   - `isAuth` stubbed (so we can spy on what permission set was passed in)
 *   - `assertChurchScope` resolved (auth is asserted separately)
 *   - `makeServantCypher` resolved (servant-history bootstrap not under test)
 *   - `neo4j-driver` not loaded; the session is a hand-rolled object
 *
 * All test names begin with "W1:" for grep-ability (SYN-72):
 *   npm test -- record-service-w1 --testNamePattern="W1:"
 */

jest.mock('../utils/scope-utils', () => ({
  assertChurchScope: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
  throwToSentry: jest.fn((message: string, error: unknown) => {
    // Match the production wrapping shape so tests can assert on the surface
    // error message but still see the underlying cause.
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`${message}: ${detail}`)
  }),
}))

jest.mock('../directory/utils', () => ({
  makeServantCypher: jest.fn().mockResolvedValue(undefined),
}))

import serviceMutation from './service-resolvers'
import { recordService, absorbAllTransactions } from './service-cypher'
import { permitLeaderAdmin } from '../permissions'
import { isAuth } from '../utils/utils'
import type { Context } from '../utils/neo4j-types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Shape that satisfies BOTH consumers used by the W1 resolver path:
//   - `rearrangeCypherObject(result)` — walks `records[i].keys` + `_fields`
//   - `result.records[0].get('serviceRecord').properties.id` — direct `.get`
//
// Match the real neo4j-driver Record shape closely enough that both work
// against the same fixture.
const makeMockQueryResult = (data: Record<string, unknown>) => {
  const keys = Object.keys(data)
  const fields = Object.values(data)
  return {
    records: [
      {
        keys,
        _fields: fields,
        get: (key: string) => data[key],
      },
    ],
  }
}

// `executeRead` in the resolver gets a callback `(tx) => tx.run(...)`. We mock
// at the executeRead boundary and resolve the QueryResult directly — same as
// service-vacation.test.ts.

// `executeWrite` in the resolver gets a callback that does THREE tx.run calls
// in sequence: recordService, absorbAllTransactions, recomputeAggregateChain.
// To assert what params are sent into each, we have to actually invoke that
// callback with a tx mock. This helper does that and records every tx.run
// call so the test can assert (a) the Cypher string and (b) the params.
const captureExecuteWrite = (createRes: ReturnType<typeof makeMockQueryResult>) => {
  const txRunCalls: Array<{ cypher: string; params: Record<string, unknown> }> = []
  const tx = {
    run: jest.fn((cypher: string, params: Record<string, unknown>) => {
      txRunCalls.push({ cypher, params })
      // The resolver only inspects the first call's records (createRes). The
      // other two (absorb, recompute) are awaited but their results are
      // ignored by the resolver, so an empty result is fine.
      if (txRunCalls.length === 1) return Promise.resolve(createRes)
      return Promise.resolve({ records: [] })
    }),
  }
  const executeWrite = jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) => {
    return cb(tx)
  })
  return { executeWrite, txRunCalls }
}

const mockJwt = {
  userId: 'user_leader_1',
  sub: 'user_leader_1',
  roles: ['leaderBacenta' as const],
  iss: 'test',
  aud: ['test'],
  iat: 0,
  exp: 9999999999,
  scope: 'openid',
  azp: 'test',
  permissions: ['leaderBacenta' as const],
}

const baseArgs = {
  churchId: 'bacenta_1',
  serviceDate: '2024-01-07',
  attendance: 20,
  income: 500,
  foreignCurrency: '',
  numberOfTithers: 5,
  treasurers: ['member_1', 'member_2'],
  treasurerSelfie: 'https://img.example/selfie.jpg',
  familyPicture: 'https://img.example/family.jpg',
}

const NO_DOUBLE_FILL_ERROR = 'You have already filled your service form this week!'
const REPEATING_TREASURERS_ERROR = 'You cannot choose the same treasurer twice!'

let mockSession: {
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context

// Build a happy-path executeRead chain. Adjust per-test by overriding the
// individual `mockResolvedValueOnce` calls *after* this is called.
const primeHappyPathReads = (
  options: { conversionRateToDollar?: number; labels?: string[] } = {}
) => {
  const { conversionRateToDollar = 8, labels = ['Active', 'Bacenta'] } = options
  mockSession.executeRead
    // checkCurrentServiceLog → exists = true
    .mockResolvedValueOnce({ records: [{ get: jest.fn().mockReturnValue(true) }] })
    // checkFormFilledThisWeek → not filled, active church
    .mockResolvedValueOnce(makeMockQueryResult({ alreadyFilled: false, labels }))
    // getCurrency → conversion rate
    .mockResolvedValueOnce(makeMockQueryResult({ conversionRateToDollar, labels }))
    // getHigherChurches — its result is not used by the resolver
    .mockResolvedValueOnce(makeMockQueryResult({}))
}

// Pin "now" to the same week as the test fixtures' serviceDate (2024-01-07
// is a Sunday in the Mon Jan 1 → Sun Jan 7 ISO week). Without this the
// server-side current-week guard rejects every test fixture.
beforeAll(() => {
  jest.useFakeTimers().setSystemTime(new Date('2024-01-07T12:00:00Z'))
})

afterAll(() => {
  jest.useRealTimers()
})

beforeEach(() => {
  mockSession = {
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
// W1 — auth gate
// ---------------------------------------------------------------------------
describe('W1 — RecordService: auth gate', () => {
  it('W1: isAuth is called with permitLeaderAdmin(Bacenta) — leaderBacenta is the canonical role', async () => {
    primeHappyPathReads()
    const { executeWrite } = captureExecuteWrite(
      makeMockQueryResult({
        serviceRecord: { properties: { id: 'sr_new', income: 500 } },
      })
    )
    mockSession.executeWrite = executeWrite

    await serviceMutation.RecordService(null, baseArgs, context)

    expect(isAuth).toHaveBeenCalledWith(
      permitLeaderAdmin('Bacenta'),
      context.jwt.roles
    )
  })

  it('W1: rejects when isAuth throws (non-leader role) — no DB calls happen', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('You are not permitted to run this mutation')
    })

    await expect(
      serviceMutation.RecordService(null, baseArgs, context)
    ).rejects.toThrow('You are not permitted to run this mutation')

    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  // Characterization note: `permitLeaderAdmin('Bacenta')` is broader than what
  // the ticket scope hinted at (`permitLeader('Bacenta')`). The actual gating
  // role set INCLUDES every admin from adminGovernorship up through
  // adminDenomination — admins can record on behalf of any Bacenta within
  // their tree. This is intentional per ADR-001 (FE/BE mirror), but worth
  // pinning so a future "tighten to leader only" refactor doesn't slip in
  // silently. See `api/src/resolvers/permissions.ts`.
  it('W1: gating role set includes both leader<Bacenta..> and admin<Governorship..> chains', () => {
    const allowed = permitLeaderAdmin('Bacenta')
    expect(allowed).toEqual(expect.arrayContaining(['leaderBacenta']))
    expect(allowed).toEqual(expect.arrayContaining(['adminGovernorship']))
    expect(allowed).toEqual(expect.arrayContaining(['adminDenomination']))
  })
})

// ---------------------------------------------------------------------------
// W1 — happy path: cedi math + foreign-currency override
// ---------------------------------------------------------------------------
describe('W1 — RecordService: cedi + foreign currency math', () => {
  it('W1: passes income, attendance, foreignCurrency, conversionRateToDollar through to recordService Cypher unchanged', async () => {
    primeHappyPathReads({ conversionRateToDollar: 8 })
    const { executeWrite, txRunCalls } = captureExecuteWrite(
      makeMockQueryResult({
        serviceRecord: { properties: { id: 'sr_new', income: 500 } },
      })
    )
    mockSession.executeWrite = executeWrite

    await serviceMutation.RecordService(null, baseArgs, context)

    // First tx.run is recordService — exact Cypher + exact params.
    const firstCall = txRunCalls[0]
    expect(firstCall.cypher).toBe(recordService)
    expect(firstCall.params).toMatchObject({
      churchId: 'bacenta_1',
      serviceDate: '2024-01-07',
      attendance: 20,
      income: 500,
      foreignCurrency: '',
      numberOfTithers: 5,
      treasurers: ['member_1', 'member_2'],
      treasurerSelfie: 'https://img.example/selfie.jpg',
      familyPicture: 'https://img.example/family.jpg',
      conversionRateToDollar: 8,
    })
    // jwt is threaded through so the Cypher can $jwt.userId — characterise it
    // here so a refactor that strips $jwt-from-context is caught.
    expect(firstCall.params.jwt).toBe(context.jwt)
  })

  it('W1: forwards a foreignCurrency code (e.g. USD) through to the recordService Cypher', async () => {
    primeHappyPathReads({ conversionRateToDollar: 12.5 })
    const { executeWrite, txRunCalls } = captureExecuteWrite(
      makeMockQueryResult({
        serviceRecord: { properties: { id: 'sr_usd', foreignCurrency: 'USD' } },
      })
    )
    mockSession.executeWrite = executeWrite

    await serviceMutation.RecordService(
      null,
      { ...baseArgs, foreignCurrency: 'USD', income: 1250 },
      context
    )

    const firstCall = txRunCalls[0]
    expect(firstCall.params).toMatchObject({
      income: 1250,
      foreignCurrency: 'USD',
      conversionRateToDollar: 12.5,
    })

    // The cedi → dollar conversion is computed INSIDE the Cypher
    // (`$income / $conversionRateToDollar`). Pin that the divisor parameter
    // is the one returned by `getCurrency`, NOT a hard-coded constant — a
    // recurring source of bugs when refactoring this resolver.
    expect(firstCall.cypher).toMatch(
      /serviceRecord\.dollarIncome = round\(toFloat\(\$income \/ \$conversionRateToDollar\), 2\)/
    )
  })

  it('W1: the recordService Cypher writes income, cash, AND dollarIncome (cedi math contract)', () => {
    // Pure Cypher-string assertion — pins the math contract independent of
    // any test wiring. Cash and income both start at the same submitted
    // amount; income is later overwritten by absorbAllTransactions to fold
    // in online giving (`$income + $onlineGiving`).
    expect(recordService).toMatch(/serviceRecord\.income = round\(toFloat\(\$income\), 2\)/)
    expect(recordService).toMatch(/serviceRecord\.cash = round\(toFloat\(\$income\), 2\)/)
    expect(recordService).toMatch(
      /serviceRecord\.dollarIncome = round\(toFloat\(\$income \/ \$conversionRateToDollar\), 2\)/
    )
  })

  it('W1: absorbAllTransactions Cypher recomputes income = cash + onlineGiving and re-derives dollarIncome', () => {
    // Second writer in the transaction — folds Paystack `Transaction` nodes
    // into the new ServiceRecord. Captures the cedi math after online giving
    // is absorbed.
    expect(absorbAllTransactions).toMatch(/serviceRecord\.onlineGiving = amount/)
    expect(absorbAllTransactions).toMatch(
      /serviceRecord\.cash = round\(toFloat\(serviceRecord\.income\), 2\)/
    )
    expect(absorbAllTransactions).toMatch(
      /serviceRecord\.income = round\(toFloat\(amount \+ serviceRecord\.income\), 2\)/
    )
    expect(absorbAllTransactions).toMatch(
      /serviceRecord\.dollarIncome = round\(toFloat\(serviceRecord\.income \/ \$conversionRateToDollar\), 2\)/
    )
  })

  it('W1: returns the serviceRecord.properties shape from the create result', async () => {
    primeHappyPathReads()
    const { executeWrite } = captureExecuteWrite(
      makeMockQueryResult({
        serviceRecord: {
          properties: {
            id: 'sr_new',
            attendance: 20,
            income: 500,
            cash: 500,
            dollarIncome: 62.5,
          },
        },
      })
    )
    mockSession.executeWrite = executeWrite

    const result = await serviceMutation.RecordService(null, baseArgs, context)

    expect(result).toMatchObject({
      id: 'sr_new',
      attendance: 20,
      income: 500,
      cash: 500,
      dollarIncome: 62.5,
    })
  })
})

// ---------------------------------------------------------------------------
// W1 — Cypher params: parameterised (ADR-012)
// ---------------------------------------------------------------------------
describe('W1 — RecordService: ADR-012 parameterised Cypher', () => {
  it('W1: every variable input is referenced as $param (no string interpolation)', () => {
    // ADR-012: all variable inputs must be `$param`-bound. A regression here
    // is a SQL-injection-class issue for Cypher.
    expect(recordService).toMatch(/\$attendance/)
    expect(recordService).toMatch(/\$income/)
    expect(recordService).toMatch(/\$conversionRateToDollar/)
    expect(recordService).toMatch(/\$foreignCurrency/)
    expect(recordService).toMatch(/\$numberOfTithers/)
    expect(recordService).toMatch(/\$treasurerSelfie/)
    expect(recordService).toMatch(/\$familyPicture/)
    expect(recordService).toMatch(/\$churchId/)
    expect(recordService).toMatch(/\$serviceDate/)
    expect(recordService).toMatch(/\$jwt\.userId/)
    expect(recordService).toMatch(/\$treasurers/)
    // No backtick template substitution markers anywhere in the cypher body.
    expect(recordService).not.toMatch(/\$\{[^}]+\}/)
  })

  it('W1: absorbAllTransactions binds $serviceRecordId and $conversionRateToDollar', () => {
    expect(absorbAllTransactions).toMatch(/\$serviceRecordId/)
    expect(absorbAllTransactions).toMatch(/\$conversionRateToDollar/)
    expect(absorbAllTransactions).not.toMatch(/\$\{[^}]+\}/)
  })
})

// ---------------------------------------------------------------------------
// W1 — Idempotency (characterization)
// ---------------------------------------------------------------------------
describe('W1 — RecordService: idempotency (characterization)', () => {
  it('W1: throws no_double_form_filling when checkFormFilledThisWeek reports alreadyFilled', async () => {
    mockSession.executeRead
      // checkCurrentServiceLog → exists
      .mockResolvedValueOnce({ records: [{ get: jest.fn().mockReturnValue(true) }] })
      // checkFormFilledThisWeek → ALREADY FILLED
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: true, labels: ['Active', 'Bacenta'] })
      )
      .mockResolvedValueOnce(makeMockQueryResult({ conversionRateToDollar: 8 }))
      .mockResolvedValueOnce(makeMockQueryResult({}))

    await expect(
      serviceMutation.RecordService(null, baseArgs, context)
    ).rejects.toThrow(NO_DOUBLE_FILL_ERROR)

    // No second ServiceRecord is ever written.
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  // Characterization: the idempotency guard is BYPASSED for Oversight and
  // Denomination churches. This is current behavior (see service-resolvers.ts
  // around the `serviceCheck.labels?.includes` check) — Oversight/Denomination
  // can submit multiple records per week. Capture both branches.
  it('W1: Oversight churches CAN bypass the no-double-form-filling guard (current behavior)', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce({ records: [{ get: jest.fn().mockReturnValue(true) }] })
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: true, labels: ['Oversight'] })
      )
      .mockResolvedValueOnce(
        makeMockQueryResult({ conversionRateToDollar: 8, labels: ['Oversight'] })
      )
      .mockResolvedValueOnce(makeMockQueryResult({}))
    const { executeWrite } = captureExecuteWrite(
      makeMockQueryResult({
        serviceRecord: { properties: { id: 'sr_oversight_dup' } },
      })
    )
    mockSession.executeWrite = executeWrite

    await expect(
      serviceMutation.RecordService(null, baseArgs, context)
    ).resolves.toMatchObject({ id: 'sr_oversight_dup' })
  })

  it('W1: Denomination churches CAN bypass the no-double-form-filling guard (current behavior)', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce({ records: [{ get: jest.fn().mockReturnValue(true) }] })
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: true, labels: ['Denomination'] })
      )
      .mockResolvedValueOnce(
        makeMockQueryResult({ conversionRateToDollar: 8, labels: ['Denomination'] })
      )
      .mockResolvedValueOnce(makeMockQueryResult({}))
    const { executeWrite } = captureExecuteWrite(
      makeMockQueryResult({
        serviceRecord: { properties: { id: 'sr_denomination_dup' } },
      })
    )
    mockSession.executeWrite = executeWrite

    await expect(
      serviceMutation.RecordService(null, baseArgs, context)
    ).resolves.toMatchObject({ id: 'sr_denomination_dup' })
  })

  // `recordService` now uses MERGE keyed on `<churchId>-<week>-<year>` with
  // ON CREATE SET + a `_isNew` sentinel. A second writer whose MERGE matches
  // the existing node gets `_isNew = null` → `WHERE isNew` filters it out →
  // 0 rows → resolver throws. Both concurrent writers can race past the JS
  // read, but only the first MERGE writer creates a node. ADR-005 / SYN-123.
  it('W1: concurrent-submission idempotency — MERGE returns 0 rows on duplicate, resolver throws', async () => {
    primeHappyPathReads()
    // The second writer: MERGE matched the existing node → WHERE isNew filtered
    // it → createRes has no records.
    const { executeWrite } = captureExecuteWrite(
      { records: [] } as unknown as ReturnType<typeof makeMockQueryResult>
    )
    mockSession.executeWrite = executeWrite

    await expect(
      serviceMutation.RecordService(null, baseArgs, context)
    ).rejects.toThrow('Service record could not be created')
  })
})

// ---------------------------------------------------------------------------
// W1 — Validation (treasurers + bad input)
// ---------------------------------------------------------------------------
describe('W1 — RecordService: validation', () => {
  it('W1: rejects when the same treasurer appears twice', async () => {
    // Repeating-treasurer check runs BEFORE any DB read.
    await expect(
      serviceMutation.RecordService(
        null,
        { ...baseArgs, treasurers: ['member_1', 'member_1'] },
        context
      )
    ).rejects.toThrow(REPEATING_TREASURERS_ERROR)

    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('W1: negative income is rejected before any DB write (ADR-005 / SYN-124)', async () => {
    await expect(
      serviceMutation.RecordService(null, { ...baseArgs, income: -500 }, context)
    ).rejects.toThrow('income must be a positive number.')

    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('W1: NaN income is rejected before any DB write (ADR-005 / SYN-124)', async () => {
    await expect(
      serviceMutation.RecordService(
        null,
        { ...baseArgs, income: Number.NaN },
        context
      )
    ).rejects.toThrow('income must be a finite number.')

    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// W1 — Atomicity: create + absorb + recompute in one executeWrite
// ---------------------------------------------------------------------------
describe('W1 — RecordService: atomic write contract', () => {
  it('W1: exactly ONE executeWrite call wraps recordService + absorbAllTransactions + recompute', async () => {
    primeHappyPathReads()
    const { executeWrite, txRunCalls } = captureExecuteWrite(
      makeMockQueryResult({
        serviceRecord: { properties: { id: 'sr_atomic' } },
      })
    )
    mockSession.executeWrite = executeWrite

    await serviceMutation.RecordService(null, baseArgs, context)

    // ADR-005 §atomicity: all three writes (record, absorb, recompute) MUST
    // share one transaction — if any fails the whole submission is rolled
    // back. A refactor that splits these into separate executeWrite calls
    // loses that guarantee.
    expect(executeWrite).toHaveBeenCalledTimes(1)
    expect(txRunCalls).toHaveLength(3)
    expect(txRunCalls[0].cypher).toBe(recordService)
    expect(txRunCalls[1].cypher).toBe(absorbAllTransactions)
    // The third call is the recompute chain (verified by the param shape).
    expect(txRunCalls[2].params).toMatchObject({
      churchId: 'bacenta_1',
    })
  })

  it('W1: absorbAllTransactions is called with the freshly created serviceRecordId from createRes', async () => {
    primeHappyPathReads()
    const { executeWrite, txRunCalls } = captureExecuteWrite(
      makeMockQueryResult({
        serviceRecord: { properties: { id: 'sr_just_created' } },
      })
    )
    mockSession.executeWrite = executeWrite

    await serviceMutation.RecordService(null, baseArgs, context)

    // absorbAllTransactions must reuse the SAME serviceRecordId emitted by
    // the create step — otherwise the online giving folds into the wrong
    // node (or nothing at all).
    expect(txRunCalls[1].params).toMatchObject({
      serviceRecordId: 'sr_just_created',
      conversionRateToDollar: 8,
    })
  })

  it('W1: when recordService returns no records, the transaction throws and no aggregate is recomputed', async () => {
    primeHappyPathReads()
    const { executeWrite, txRunCalls } = captureExecuteWrite(
      // createRes has zero records — simulates the "church is not Bacenta/Gov/Council/Stream" path
      { records: [] } as unknown as ReturnType<typeof makeMockQueryResult>
    )
    mockSession.executeWrite = executeWrite

    await expect(
      serviceMutation.RecordService(null, baseArgs, context)
    ).rejects.toThrow('Service record could not be created')

    // Only the recordService call happened — absorbAllTransactions and the
    // recompute were skipped because the inner throw aborts the transaction.
    expect(txRunCalls).toHaveLength(1)
    expect(txRunCalls[0].cypher).toBe(recordService)
  })
})

// ---------------------------------------------------------------------------
// W1 — Session hygiene (close in finally)
// ---------------------------------------------------------------------------
describe('W1 — RecordService: session lifecycle', () => {
  it('W1: every opened session is closed on the happy path (3 sessions opened, 3 closed)', async () => {
    primeHappyPathReads()
    const { executeWrite } = captureExecuteWrite(
      makeMockQueryResult({
        serviceRecord: { properties: { id: 'sr_ok' } },
      })
    )
    mockSession.executeWrite = executeWrite

    await serviceMutation.RecordService(null, baseArgs, context)

    // Same mockSession is returned for all three `session()` calls in the
    // resolver, so close() is called three times on it. This both pins the
    // "open three sessions" choice (current behavior) and the "close all
    // three in finally" hygiene contract.
    expect(context.executionContext.session).toHaveBeenCalledTimes(3)
    expect(mockSession.close).toHaveBeenCalledTimes(3)
  })

  it('W1: sessions are still closed when an error is thrown mid-flow', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce({ records: [{ get: jest.fn().mockReturnValue(true) }] })
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: true, labels: ['Active', 'Bacenta'] })
      )
      .mockResolvedValueOnce(makeMockQueryResult({ conversionRateToDollar: 8 }))
      .mockResolvedValueOnce(makeMockQueryResult({}))

    await expect(
      serviceMutation.RecordService(null, baseArgs, context)
    ).rejects.toThrow()

    // Finally block runs regardless. All three sessions still get closed.
    expect(mockSession.close).toHaveBeenCalledTimes(3)
  })
})

// ---------------------------------------------------------------------------
// W1 — HistoryLog (by design: recordService does not write one)
// ---------------------------------------------------------------------------
describe('W1 — RecordService: HistoryLog (not written by design)', () => {
  it('W1: recordService Cypher does NOT write a HistoryLog node (by design)', () => {
    expect(recordService).not.toMatch(/HistoryLog/)
    expect(recordService).not.toMatch(/historyLog/)
  })

  it('W1: recordService Cypher writes a LOGGED_BY edge from record → leader (the actor link)', () => {
    expect(recordService).toMatch(/MERGE \(serviceRecord\)-\[:LOGGED_BY\]->\(leader\)/)
    expect(recordService).toMatch(/MATCH \(leader:Member \{id: \$jwt\.userId\}\)/)
  })
})
