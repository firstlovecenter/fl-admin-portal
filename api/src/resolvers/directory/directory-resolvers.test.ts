/**
 * SYN-207 — UpdateMemberDetails IDOR / BOLA guard.
 *
 * `isAuth(permitLeaderAdmin('Bacenta'), ...)` only proves the caller HOLDS a
 * bacenta-level role — it says nothing about WHICH member they may edit.
 * Before the fix any bacenta leader/admin could rewrite ANY member's profile
 * org-wide by passing that member's id (same class as SYN-185 / SYN-186).
 *
 * The resolver now anchors on the target member's live bacenta via
 * `assertScopeViaMember`, with a deliberate carve-out for self-edits (the
 * user-profile EditPage posts this same mutation with id === the caller's own
 * id, and a servant's personal bacenta need not sit inside the scope they
 * lead).
 *
 * `scope-utils` is mocked (repo convention — see
 * `no-income/no-income-vacation.test.ts`) so the two branches can be driven
 * deterministically; the FORBIDDEN GraphQLError it throws is reproduced
 * faithfully so we assert the error the client actually receives.
 *
 * `isAuth` is left REAL so the role-gate test exercises the true permission
 * matrix rather than a mock.
 */

import { GraphQLError } from 'graphql'
import directoryMutation from './directory-resolvers'
import { assertScopeViaMember } from '../utils/scope-utils'
import type { Context } from '../utils/neo4j-types'
import type { Member } from '../utils/types'

jest.mock('../utils/scope-utils', () => ({
  assertChurchScope: jest.fn().mockResolvedValue(undefined),
  assertScopeViaMember: jest.fn().mockResolvedValue(undefined),
}))

const mockAssertScopeViaMember = assertScopeViaMember as jest.Mock

const CALLER_ID = 'caller_self_id'
const OTHER_MEMBER_ID = 'victim_member_id'

// The exact error shape `runAssert` throws on zero rows (scope-utils.ts).
const forbidden = () =>
  new GraphQLError(
    'You are not permitted to access this resource. ' +
      'Your role does not cover the requested church or any of its ancestors.',
    { extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' } }
  )

// A neo4j QueryResult as `rearrangeCypherObject` expects it.
const makeResult = (rows: Record<string, unknown>[]) => ({
  records: rows.map((row) => ({
    keys: Object.keys(row),
    _fields: Object.values(row),
  })),
})

const args = (overrides: Partial<Member> = {}) =>
  ({
    id: OTHER_MEMBER_ID,
    firstName: 'Kwame',
    lastName: 'Mensah',
    email: 'Kwame@Example.COM',
    phoneNumber: '+233200000000',
    whatsappNumber: '+233200000000',
    gender: 'Male',
    ...overrides,
  } as unknown as Member)

let mockSession: {
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let sessionFactory: jest.Mock
let context: Context

const makeContext = (roles: string[], userId = CALLER_ID): Context =>
  ({
    jwt: { userId, sub: userId, roles },
    executionContext: { session: sessionFactory },
  } as unknown as Context)

beforeEach(() => {
  mockAssertScopeViaMember.mockReset().mockResolvedValue(undefined)

  mockSession = {
    // No email / whatsapp collisions by default.
    executeRead: jest.fn().mockResolvedValue(makeResult([])),
    executeWrite: jest.fn().mockResolvedValue(makeResult([{ id: 'written' }])),
    close: jest.fn().mockResolvedValue(undefined),
  }
  sessionFactory = jest.fn().mockReturnValue(mockSession)
  context = makeContext(['leaderBacenta'])
})

describe('UpdateMemberDetails — scope enforcement (SYN-207)', () => {
  it('rejects a caller editing a member OUTSIDE their scope, and never writes', async () => {
    mockAssertScopeViaMember.mockRejectedValueOnce(forbidden())

    const caught = await directoryMutation
      .UpdateMemberDetails(null, args(), context)
      .then(
        () => null,
        (error: unknown) => error
      )

    expect(caught).toBeInstanceOf(GraphQLError)
    expect((caught as GraphQLError).extensions.code).toBe('FORBIDDEN')

    // The scope gate was anchored on the TARGET member, not the caller.
    expect(mockAssertScopeViaMember).toHaveBeenCalledTimes(1)
    expect(mockAssertScopeViaMember).toHaveBeenCalledWith(
      context,
      OTHER_MEMBER_ID
    )

    // The security regression assertion: nothing touched the database.
    expect(sessionFactory).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
    expect(mockSession.executeRead).not.toHaveBeenCalled()
  })

  it('lets a caller edit a member INSIDE their scope and proceeds to the write', async () => {
    const result = await directoryMutation.UpdateMemberDetails(
      null,
      args(),
      context
    )

    expect(mockAssertScopeViaMember).toHaveBeenCalledWith(
      context,
      OTHER_MEMBER_ID
    )
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ id: 'written' })
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })

  it('runs the scope check BEFORE opening a session (gate is ordered first)', async () => {
    const order: string[] = []
    mockAssertScopeViaMember.mockImplementationOnce(async () => {
      order.push('scope')
    })
    sessionFactory.mockImplementationOnce(() => {
      order.push('session')
      return mockSession
    })

    await directoryMutation.UpdateMemberDetails(null, args(), context)

    expect(order).toEqual(['scope', 'session'])
  })

  it('SKIPS the scope check when a caller edits their OWN profile (self-edit carve-out)', async () => {
    const result = await directoryMutation.UpdateMemberDetails(
      null,
      args({ id: CALLER_ID }),
      context
    )

    // The carve-out is deliberate: a servant's personal bacenta need not sit
    // inside the scope they lead, so asserting here would lock them out of
    // their own EditPage.
    expect(mockAssertScopeViaMember).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ id: 'written' })
  })

  it('rejects a caller without a bacenta-level role before anything else (isAuth)', async () => {
    const unprivileged = makeContext(['tellerStream'])

    const caught = await directoryMutation
      .UpdateMemberDetails(null, args(), unprivileged)
      .then(
        () => null,
        (error: unknown) => error
      )

    expect(caught).toBeInstanceOf(GraphQLError)
    expect((caught as GraphQLError).extensions.code).toBe('FORBIDDEN')
    expect((caught as GraphQLError).message).toBe(
      'You are not permitted to run this mutation'
    )

    // isAuth short-circuits: no scope query, no session, no write.
    expect(mockAssertScopeViaMember).not.toHaveBeenCalled()
    expect(sessionFactory).not.toHaveBeenCalled()
  })

  it('rejects an anonymous caller (no jwt) at the role gate', async () => {
    const anonymous = {
      jwt: undefined,
      executionContext: { session: sessionFactory },
    } as unknown as Context

    await expect(
      directoryMutation.UpdateMemberDetails(null, args(), anonymous)
    ).rejects.toThrow('You are not permitted to run this mutation')

    expect(mockAssertScopeViaMember).not.toHaveBeenCalled()
    expect(sessionFactory).not.toHaveBeenCalled()
  })
})
