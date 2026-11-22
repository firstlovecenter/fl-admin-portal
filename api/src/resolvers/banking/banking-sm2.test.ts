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
 *   - ManuallyConfirmOfferingPayment — role gate + scope; any church level (SYN-266)
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
  getServiceRecordChurches,
  submitBankingSlip,
  manuallyConfirmOfferingPayment as manuallyConfirmCypher,
} from './banking-cypher'
import type { Context } from '../utils/neo4j-types'
import type { Role } from '../utils/types'
import type { ServantTree } from '../utils/allowed-church-ids'
import { isAuth } from '../utils/utils'
import { assertScopeViaServiceRecord } from '../utils/scope-utils'
import { permitConfirmOffering } from '../permissions'
import { CONFIRM_OFFERING_ROLES } from '../../../../lib/permission-test-scenarios'
import { GraphQLError } from 'graphql'

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
// ManuallyConfirmOfferingPayment fixtures (SYN-266)
// ---------------------------------------------------------------------------

// The record under test hangs off Bacenta 'bacenta-a', inside Stream A.
const RECORD_CHURCH = 'bacenta-a'
const STREAM_A_REACH = ['stream-a', 'council-a', 'gov-a', RECORD_CHURCH]

const tree = (
  type: ServantTree['type'],
  level: ServantTree['level'],
  reach: string[]
): ServantTree => ({
  type,
  level,
  churchId: reach[0],
  churchName: reach[0],
  reach,
})

const callerContext = (roles: string[], servantTrees: ServantTree[]) =>
  ({
    ...context,
    jwt: { ...mockJwt, roles, servantTrees },
  }) as unknown as Context

const streamATeller = () =>
  callerContext(
    ['tellerStream'],
    [tree('IS_TELLER_FOR', 'Stream', STREAM_A_REACH)]
  )

// executeRead / executeWrite run their callback against this fake tx, so a
// test can see the Cypher and params each transaction was given.
let txRun: jest.Mock

const mockTransactions = () => {
  txRun = jest.fn()
  mockSession.executeRead.mockImplementation((work) => work({ run: txRun }))
  mockSession.executeWrite.mockImplementation((work) => work({ run: txRun }))
}

// Church lookup -> previous-service check (none) -> the confirm write.
const mockConfirmFlow = (
  service: Record<string, unknown> = { id: 'sr_test' }
) => {
  mockTransactions()
  txRun
    .mockResolvedValueOnce({
      records: [{ get: jest.fn().mockReturnValue([RECORD_CHURCH]) }],
    })
    .mockResolvedValueOnce(
      makeMockQueryResult({ service: { properties: service } })
    )
  mockSession.run.mockResolvedValueOnce({ records: [] })
}

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
  const confirmArgs = { serviceRecordId: 'sr_test' }
  const { isAuth: realIsAuth } = jest.requireActual(
    '../utils/utils'
  ) as typeof import('../utils/utils')

  // The role list the resolver hands to isAuth, read back from the mock so
  // the assertions below follow the real gate rather than a copy of it.
  const confirmGate = async (): Promise<Role[]> => {
    mockConfirmFlow()
    await bankingMutation.ManuallyConfirmOfferingPayment(
      null,
      confirmArgs,
      streamATeller()
    )
    return (isAuth as jest.Mock).mock.calls[0][0]
  }

  // SYN-266: Stream tellers, Stream admins and every admin above them.
  it('SM2: isAuth gets permitConfirmOffering — Stream tellers and Stream-and-higher admins', async () => {
    expect(await confirmGate()).toEqual(CONFIRM_OFFERING_ROLES)
  })

  // fishers maps to no servant edge, so it can never be bound to the
  // record's church — it is not a confirming role.
  it('SM2: the gate admits the confirming roles and refuses fishers, leaders and sub-Stream admins', async () => {
    const gate = await confirmGate()

    for (const role of CONFIRM_OFFERING_ROLES) {
      expect(() => realIsAuth(gate, [role as Role])).not.toThrow()
    }
    for (const role of [
      'fishers',
      'leaderBacenta',
      'leaderStream',
      'adminGovernorship',
      'adminCouncil',
      'arrivalsCounterStream',
    ]) {
      expect(() => realIsAuth(gate, [role as Role])).toThrow(
        'You are not permitted to run this mutation'
      )
    }
  })

  it('SM2: throws when isAuth rejects the caller (non-teller role)', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Insufficient permissions')
    })

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(null, confirmArgs, context)
    ).rejects.toThrow('Insufficient permissions')
    // isAuth runs first: no scope check, no session, nothing written.
    expect(assertScopeViaServiceRecord).not.toHaveBeenCalled()
    expect(context.executionContext.session).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM2: runs the live scope check on the record', async () => {
    mockConfirmFlow()

    await bankingMutation.ManuallyConfirmOfferingPayment(
      null,
      confirmArgs,
      streamATeller()
    )

    expect(assertScopeViaServiceRecord).toHaveBeenCalledWith(
      expect.anything(),
      'sr_test'
    )
  })

  it('SM2: an out-of-scope record is refused and nothing is written', async () => {
    ;(assertScopeViaServiceRecord as jest.Mock).mockRejectedValueOnce(
      new GraphQLError('You are not permitted to access this resource.', {
        extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' },
      })
    )

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(
        null,
        confirmArgs,
        streamATeller()
      )
    ).rejects.toThrow('You are not permitted to access this resource.')
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it("SM2: looks up the record's own church for the per-church role check", async () => {
    mockConfirmFlow()

    await bankingMutation.ManuallyConfirmOfferingPayment(
      null,
      confirmArgs,
      streamATeller()
    )

    expect(txRun).toHaveBeenNthCalledWith(
      1,
      getServiceRecordChurches,
      confirmArgs
    )
  })

  // SYN-266: the record's church level does not matter, only that the
  // caller's teller/admin role covers its church.
  it.each([
    [
      'a Stream teller',
      'tellerStream',
      'IS_TELLER_FOR',
      'Stream',
      STREAM_A_REACH,
    ],
    ['a Stream admin', 'adminStream', 'IS_ADMIN_FOR', 'Stream', STREAM_A_REACH],
    [
      'a Campus admin',
      'adminCampus',
      'IS_ADMIN_FOR',
      'Campus',
      ['campus-1', ...STREAM_A_REACH],
    ],
  ] as const)(
    "SM2: %s confirms a Bacenta service inside their church's reach",
    async (_who, role, edge, level, reach) => {
      mockConfirmFlow()

      await expect(
        bankingMutation.ManuallyConfirmOfferingPayment(
          null,
          confirmArgs,
          callerContext([role], [tree(edge, level, [...reach])])
        )
      ).resolves.toMatchObject({ id: 'sr_test' })
      expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
    }
  )

  // The IDOR this check closes: isAuth passes on tellerStream (held for
  // Stream B) and the any-servant-edge scope check passes on LEADS of the
  // record's own Bacenta in Stream A — but neither grants a confirming role
  // AT that Bacenta.
  it("SM2: a teller of another Stream who leads the record's Bacenta is refused and nothing is written", async () => {
    mockConfirmFlow()

    const error = await bankingMutation
      .ManuallyConfirmOfferingPayment(
        null,
        confirmArgs,
        callerContext(
          ['tellerStream', 'leaderBacenta'],
          [
            tree('IS_TELLER_FOR', 'Stream', ['stream-b', 'council-b']),
            tree('LEADS', 'Bacenta', [RECORD_CHURCH]),
          ]
        )
      )
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(GraphQLError)
    expect((error as GraphQLError).extensions.code).toBe('FORBIDDEN')
    expect(mockSession.run).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM2: a Council admin over the record is refused — Council admins do not confirm', async () => {
    mockConfirmFlow()

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(
        null,
        confirmArgs,
        callerContext(
          ['adminCouncil'],
          [
            tree('IS_ADMIN_FOR', 'Council', [
              'council-a',
              'gov-a',
              RECORD_CHURCH,
            ]),
          ]
        )
      )
    ).rejects.toThrow('You do not hold a required role at this church.')
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  // SYN-220: one ServiceLog can be held by two churches. The role must cover
  // every one of them, so neither side's teller confirms the other's money.
  describe('a record whose ServiceLog two churches hold', () => {
    const mockSharedLog = () => {
      mockTransactions()
      txRun
        .mockResolvedValueOnce({
          records: [
            { get: jest.fn().mockReturnValue([RECORD_CHURCH, 'council-b']) },
          ],
        })
        .mockResolvedValueOnce(
          makeMockQueryResult({ service: { properties: { id: 'sr_test' } } })
        )
      mockSession.run.mockResolvedValueOnce({ records: [] })
    }

    it('SM2: is refused for a teller who covers only one of them, and nothing is written', async () => {
      mockSharedLog()

      await expect(
        bankingMutation.ManuallyConfirmOfferingPayment(
          null,
          confirmArgs,
          streamATeller()
        )
      ).rejects.toThrow('You do not hold a required role at this church.')
      expect(mockSession.executeWrite).not.toHaveBeenCalled()
    })

    it('SM2: is confirmed by an admin whose Campus covers both', async () => {
      mockSharedLog()

      await expect(
        bankingMutation.ManuallyConfirmOfferingPayment(
          null,
          confirmArgs,
          callerContext(
            ['adminCampus'],
            [
              tree('IS_ADMIN_FOR', 'Campus', [
                'campus-1',
                ...STREAM_A_REACH,
                'council-b',
              ]),
            ]
          )
        )
      ).resolves.toMatchObject({ id: 'sr_test' })
    })
  })

  it('SM2: a record no longer held by an active church is refused, and nothing is written', async () => {
    mockTransactions()
    txRun.mockResolvedValueOnce({
      records: [{ get: jest.fn().mockReturnValue([]) }],
    })

    const error = await bankingMutation
      .ManuallyConfirmOfferingPayment(null, confirmArgs, streamATeller())
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(GraphQLError)
    expect((error as GraphQLError).extensions.code).toBe('FORBIDDEN')
    expect(mockSession.run).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM2: a DB failure in the church lookup surfaces a curated retry message', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockTransactions()
    txRun.mockRejectedValueOnce(new Error('Neo4j connection reset'))

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(
        null,
        confirmArgs,
        streamATeller()
      )
    ).rejects.toThrow(
      'We could not confirm this offering payment. Please try again.'
    )
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
    expect(mockSession.close).toHaveBeenCalledTimes(1)
    errorSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// ManuallyConfirmOfferingPayment — behavior
// ---------------------------------------------------------------------------
describe('SM2 — ManuallyConfirmOfferingPayment: behavior', () => {
  const confirmArgs = { serviceRecordId: 'sr_test' }

  it('SM2: writes the manuallyConfirmOfferingPayment Cypher in a write transaction and returns the service record', async () => {
    const teller = streamATeller()
    mockConfirmFlow({
      id: 'sr_test',
      tellerConfirmationTime: '2024-01-07T10:00:00Z',
    })

    const result = await bankingMutation.ManuallyConfirmOfferingPayment(
      null,
      confirmArgs,
      teller
    )

    expect(result).toMatchObject({ id: 'sr_test' })
    expect(mockSession.run).toHaveBeenCalledTimes(1) // previous-service check
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
    expect(txRun).toHaveBeenLastCalledWith(manuallyConfirmCypher, {
      ...confirmArgs,
      jwt: teller.jwt,
      bh_method: 'teller',
      bh_toStatus: 'teller-confirmed',
      // Role-neutral — admins confirm too.
      bh_message: 'Offering manually confirmed',
    })
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })

  it('SM2: a lost race is an expected refusal — BAD_USER_INPUT, not a server error', async () => {
    mockTransactions()
    txRun
      .mockResolvedValueOnce({
        records: [{ get: jest.fn().mockReturnValue([RECORD_CHURCH]) }],
      })
      .mockResolvedValueOnce({ records: [] }) // zero rows = someone confirmed first
    mockSession.run.mockResolvedValueOnce({ records: [] }) // checkIfLastServiceBanked

    const error = await bankingMutation
      .ManuallyConfirmOfferingPayment(null, confirmArgs, streamATeller())
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(GraphQLError)
    expect((error as GraphQLError).message).toBe(
      'This offering has already been confirmed. Refresh to see the latest banking state.'
    )
    expect((error as GraphQLError).extensions.code).toBe('BAD_USER_INPUT')
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })

  // SYN-266: nothing in the write narrows by church level either — the
  // record is matched by id alone, so every level's service can be confirmed.
  it('SM2: the confirm Cypher matches the record by id with no church-level filter', () => {
    expect(manuallyConfirmCypher).toMatch(
      /MATCH \(service:ServiceRecord \{id: \$serviceRecordId\}\)/
    )
    expect(manuallyConfirmCypher).not.toMatch(
      /:(Bacenta|Governorship|Council|Stream|Campus|Oversight|Denomination)\b/
    )
  })

  it('SM2: the confirm Cypher appends a BankingHistoryLog row naming the confirmer', () => {
    expect(manuallyConfirmCypher).toMatch(
      /CREATE \(service\)-\[:HAS_BANKING_HISTORY\]->\(bhlog:BankingHistoryLog/
    )
    expect(manuallyConfirmCypher).toMatch(
      /CREATE \(author\)-\[:LOGGED_BANKING\]->\(bhlog\)/
    )
  })

  it('SM2: the church lookup returns every spine church holding the record', () => {
    expect(getServiceRecordChurches).toMatch(
      /MATCH \(record:ServiceRecord \{id: \$serviceRecordId\}\)<-\[:HAS_SERVICE\]-\(:ServiceLog\)<-\[:HAS_HISTORY\]-\(church\)/
    )
    for (const level of [
      'Bacenta',
      'Governorship',
      'Council',
      'Stream',
      'Campus',
      'Oversight',
      'Denomination',
    ]) {
      expect(getServiceRecordChurches).toContain(`church:${level}`)
    }
    expect(getServiceRecordChurches).toMatch(
      /RETURN collect\(DISTINCT church\.id\) AS churchIds/
    )
    // A shared ServiceLog (SYN-220) must not be resolved by an arbitrary pick.
    expect(getServiceRecordChurches).not.toMatch(/LIMIT/)
  })
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
// SYN-228 — outstanding-offering rule surfaces verbatim
// ---------------------------------------------------------------------------
describe('SYN-228 — previous-service banking rule is not masked', () => {
  const slipArgs = {
    serviceRecordId: 'sr_test',
    bankingSlip: 'https://res.cloudinary.com/slip.jpg',
  }
  const confirmArgs = { serviceRecordId: 'sr_test' }
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => errorSpy.mockRestore())

  it('SubmitBankingSlip: rejects with the outstanding-offering message, logs nothing, writes nothing', async () => {
    mockSession.run.mockResolvedValueOnce(
      makeLastServiceResult({ transactionStatus: null })
    )

    const promise = bankingMutation.SubmitBankingSlip(null, slipArgs, context)
    await expect(promise).rejects.toThrow('Please bank outstanding offering')
    await expect(promise).rejects.not.toThrow('We could not check')
    expect(errorSpy).not.toHaveBeenCalled()
    expect(mockSession.run).toHaveBeenCalledTimes(1)
  })

  it('SubmitBankingSlip: a DB failure in the check still surfaces the curated retry message', async () => {
    mockSession.run.mockRejectedValueOnce(new Error('Neo4j connection reset'))

    await expect(
      bankingMutation.SubmitBankingSlip(null, slipArgs, context)
    ).rejects.toThrow(
      'We could not check the previous service banking. Please try again.'
    )
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  const mockChurchLookup = () => {
    mockTransactions()
    txRun.mockResolvedValueOnce({
      records: [{ get: jest.fn().mockReturnValue([RECORD_CHURCH]) }],
    })
  }

  it('ManuallyConfirmOfferingPayment: rejects with the outstanding-offering message, logs nothing, writes nothing', async () => {
    mockChurchLookup()
    mockSession.run.mockResolvedValueOnce(
      makeLastServiceResult({ transactionStatus: null })
    )

    const promise = bankingMutation.ManuallyConfirmOfferingPayment(
      null,
      confirmArgs,
      streamATeller()
    )
    await expect(promise).rejects.toThrow('Please bank outstanding offering')
    await expect(promise).rejects.not.toThrow('We could not check')
    expect(errorSpy).not.toHaveBeenCalled()
    expect(mockSession.run).toHaveBeenCalledTimes(1)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('ManuallyConfirmOfferingPayment: a DB failure in the check still surfaces a curated retry message', async () => {
    mockChurchLookup()
    mockSession.run.mockRejectedValueOnce(new Error('Neo4j connection reset'))

    await expect(
      bankingMutation.ManuallyConfirmOfferingPayment(
        null,
        confirmArgs,
        streamATeller()
      )
    ).rejects.toThrow(
      'We could not check the previous service banking. Please try again.'
    )
    expect(errorSpy).toHaveBeenCalledTimes(1)
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
