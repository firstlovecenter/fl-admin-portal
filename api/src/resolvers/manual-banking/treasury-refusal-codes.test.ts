/**
 * SYN-292 — the teller's banking refusals ("already banked", "bacentas still
 * have to fill their forms") are refusals the teller is meant to see. They
 * must reach Apollo as BAD_USER_INPUT so error-reference.ts logs them at WARN
 * instead of filing an INTERNAL_SERVER_ERROR ticket per refusal (SYN-253).
 *
 * A real Cypher or driver failure must still come out as a plain Error, so it
 * stays INTERNAL_SERVER_ERROR and keeps logging at ERROR.
 */

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
}))

jest.mock('../utils/assert-can', () => ({
  assertCan: jest.fn(),
}))

import { GraphQLError } from 'graphql'
import treasuryMutations from './treasury-resolvers'
import { logLevelForCode } from '../utils/error-reference'
import type { Context } from '../utils/neo4j-types'

const makeMockQueryResult = (data: Record<string, unknown>) => ({
  records: [{ keys: Object.keys(data), _fields: Object.values(data) }],
})

const noFormDefaulters = makeMockQueryResult({
  defaulters: { low: 0 },
  defaultersNames: [],
})
const twoFormDefaulters = makeMockQueryResult({
  defaulters: { low: 2 },
  defaultersNames: ['Bacenta A', 'Bacenta B'],
})
// The confirm Cypher aggregates on the church, so when the WHERE clause
// excludes every record (already confirmed) it returns no row at all.
const noRows = { records: [] }
const confirmed = (key: 'governorship' | 'council') =>
  makeMockQueryResult({
    [key]: { properties: { id: `${key}_1`, name: 'Test' } },
    affectedCount: { low: 3 },
  })

let mockSession: { run: jest.Mock; executeWrite: jest.Mock; close: jest.Mock }
let context: Context

beforeEach(() => {
  mockSession = {
    run: jest.fn(),
    executeWrite: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }
  context = {
    jwt: { userId: 'teller_1', roles: ['tellerStream'] },
    executionContext: { session: jest.fn().mockReturnValue(mockSession) },
  } as unknown as Context
})

const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('expected the mutation to be refused')
    },
    (err: unknown) => err
  )

const expectRefusal = async (promise: Promise<unknown>, message: string) => {
  const error = await rejection(promise)
  expect(error).toBeInstanceOf(GraphQLError)
  expect((error as GraphQLError).message).toBe(message)
  expect((error as GraphQLError).extensions.code).toBe('BAD_USER_INPUT')
  expect(logLevelForCode((error as GraphQLError).extensions.code)).toBe('warn')
}

const confirmBanking = () =>
  treasuryMutations.ConfirmBanking(
    undefined as never,
    { governorshipId: 'governorship_1' },
    context
  )
const confirmCouncilBanking = () =>
  treasuryMutations.ConfirmCouncilBanking(
    undefined as never,
    { councilId: 'council_1' },
    context
  )

describe('SYN-292 — ConfirmBanking refusals are BAD_USER_INPUT', () => {
  it('codes "already banked" BAD_USER_INPUT when no record was confirmed', async () => {
    mockSession.run.mockResolvedValue(noFormDefaulters)
    mockSession.executeWrite.mockResolvedValue(noRows)

    await expectRefusal(
      confirmBanking(),
      "This governorship's offering has already been banked!"
    )
    expect(mockSession.close).toHaveBeenCalled()
  })

  it('codes "already banked" BAD_USER_INPUT when affectedCount is zero', async () => {
    mockSession.run.mockResolvedValue(noFormDefaulters)
    mockSession.executeWrite.mockResolvedValue(
      makeMockQueryResult({
        governorship: { properties: { id: 'governorship_1' } },
        affectedCount: { low: 0 },
      })
    )

    await expectRefusal(
      confirmBanking(),
      "This governorship's offering has already been banked!"
    )
  })

  it('codes the form-defaulters refusal BAD_USER_INPUT and never writes', async () => {
    mockSession.run.mockResolvedValue(twoFormDefaulters)

    await expectRefusal(
      confirmBanking(),
      'You cannot confirm this governorship until all the active bacentas have filled their forms. Outstanding bacentas are: Bacenta A, Bacenta B'
    )
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
    // The refusal used to throw before the try, leaking the session.
    expect(mockSession.close).toHaveBeenCalled()
  })

  it('keeps a real write failure at INTERNAL (plain Error → ERROR log)', async () => {
    mockSession.run.mockResolvedValue(noFormDefaulters)
    mockSession.executeWrite.mockRejectedValue(new Error('connection reset'))

    const error = await rejection(confirmBanking())
    expect(error).not.toBeInstanceOf(GraphQLError)
    expect((error as Error).message).toContain(
      'There was a problem confirming the banking'
    )
  })

  it('returns the governorship as banked on a successful batch', async () => {
    mockSession.run.mockResolvedValue(noFormDefaulters)
    mockSession.executeWrite.mockResolvedValue(confirmed('governorship'))

    await expect(confirmBanking()).resolves.toEqual({
      id: 'governorship_1',
      name: 'Test',
      banked: true,
    })
  })
})

describe('SYN-292 — ConfirmCouncilBanking refusals are BAD_USER_INPUT', () => {
  it('codes "already banked" BAD_USER_INPUT when no record was confirmed', async () => {
    mockSession.executeWrite.mockResolvedValue(noRows)

    await expectRefusal(
      confirmCouncilBanking(),
      "This council's offering has already been banked!"
    )
    expect(mockSession.close).toHaveBeenCalled()
  })

  it('keeps a real write failure at INTERNAL (plain Error → ERROR log)', async () => {
    mockSession.executeWrite.mockRejectedValue(new Error('connection reset'))

    const error = await rejection(confirmCouncilBanking())
    expect(error).not.toBeInstanceOf(GraphQLError)
    expect((error as Error).message).toContain(
      'There was a problem confirming the banking'
    )
  })

  it('returns the council as banked on a successful batch', async () => {
    mockSession.executeWrite.mockResolvedValue(confirmed('council'))

    await expect(confirmCouncilBanking()).resolves.toEqual({
      id: 'council_1',
      name: 'Test',
      banked: true,
    })
  })
})
