/**
 * Scope-gate (IDOR) tests for the member-targeting mutations in
 * directory-resolvers.ts. Each describe below pins one resolver's gate and
 * names its ticket; see the per-describe docblocks.
 *
 * SYN-207 — UpdateMemberDetails's scope gate.
 *
 * UpdateMemberDetails let a Bacenta-level leader/admin edit ANY member's
 * profile org-wide by id: isAuth only checks the caller HOLDS a bacenta-level
 * role, not WHERE that member sits. Sibling resolvers in the same file
 * (UpdateMemberBacenta, ReactivateMemberToBacenta) already close this with
 * assertScopeViaMember / assertChurchScope — UpdateMemberDetails was missing
 * the same call. This file pins:
 *
 *   - assertScopeViaMember is called with args.id, after isAuth
 *   - a FORBIDDEN from assertScopeViaMember aborts before any write
 *   - the happy path still writes via updateMemberDetails, keyed on args.id
 *
 * All test names begin with "SYN-207:" for grep-ability:
 *   npm test -- directory-resolvers --testNamePattern="SYN-207:"
 */

import fs from 'fs'
import path from 'path'
import { GraphQLError } from 'graphql'
import directoryMutation from './directory-resolvers'
import {
  updateMemberDetails,
  checkMemberHasNoActiveRelationships,
  makeMemberInactive,
  removeDuplicateMember,
  setMemberStickyNote,
} from '../cypher/resolver-cypher'
import type { Context } from '../utils/neo4j-types'
import type { Member } from '../utils/types'
import { isAuth } from '../utils/utils'
import { assertScopeViaMember } from '../utils/scope-utils'
import { assertCan } from '../utils/assert-can'
import { RemoveServant } from './make-remove-servants'
import { permitLeaderAdmin } from '../permissions'

jest.mock('../utils/scope-utils', () => ({
  assertChurchScope: jest.fn().mockResolvedValue(undefined),
  assertScopeViaMember: jest.fn().mockResolvedValue(undefined),
}))

// CloseDownBacenta's per-instance gate; the SYN-236 tests below exercise the
// pre-checks behind it, not the gate itself.
jest.mock('../utils/assert-can', () => ({
  assertCan: jest.fn(),
}))

// SYN-252: lets the close-down tests assert the leader is never detached when
// the bacenta is refused.
jest.mock('./make-remove-servants', () => ({
  RemoveServant: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
}))

const mockQueryResult = (data: Record<string, unknown>) => ({
  records: [{ keys: Object.keys(data), _fields: Object.values(data) }],
})

const mockJwt = {
  userId: 'user_leader_1',
  sub: 'user_leader_1',
  roles: ['leaderBacenta'] as const,
  iss: 'test',
  aud: ['test'],
  iat: 0,
  exp: 9999999999,
  scope: 'openid',
  azp: 'test',
  permissions: ['leaderBacenta'],
}

const updateArgs = {
  id: 'member_target_1',
  firstName: 'Ama',
  lastName: 'Mensah',
  email: 'ama@example.com',
  phoneNumber: '0244000000',
  whatsappNumber: '0244000000',
  gender: 'Female',
  pictureUrl: '',
} as unknown as Member

let mockSession: {
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context

beforeEach(() => {
  jest.clearAllMocks()

  mockSession = {
    executeRead: jest.fn().mockResolvedValue({ records: [] }),
    executeWrite: jest
      .fn()
      .mockResolvedValue(
        mockQueryResult({ member: { id: 'member_target_1', firstName: 'Ama' } })
      ),
    close: jest.fn().mockResolvedValue(undefined),
  }
  context = {
    jwt: mockJwt,
    executionContext: { session: jest.fn().mockReturnValue(mockSession) },
  } as unknown as Context
})

describe('CreateMember session cleanup', () => {
  const args = {
    email: 'new@example.test',
    whatsappNumber: '0244000000',
    bacenta: 'bacenta_1',
  } as unknown as Member

  it('closes the session after registering a new member', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(mockQueryResult({ count: 0 }))
      .mockResolvedValueOnce(mockQueryResult({ predicate: false }))
    await directoryMutation.CreateMember(null, args, context)
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })

  it('closes the session after reactivating an inactive member', async () => {
    mockSession.executeRead.mockResolvedValueOnce(
      mockQueryResult({ count: 1, id: 'inactive_member' })
    )
    await directoryMutation.CreateMember(null, args, context)
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })

  it('closes the session when duplicate contact details are rejected', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(mockQueryResult({ count: 0 }))
      .mockResolvedValueOnce(
        mockQueryResult({
          predicate: true,
          member: {
            properties: {
              email: args.email,
              firstName: 'Ama',
              lastName: 'Mensah',
            },
          },
        })
      )
    await expect(
      directoryMutation.CreateMember(null, args, context)
    ).rejects.toThrow('There is a member')
    expect(mockSession.close).toHaveBeenCalledTimes(1)
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('closes the session when the database write fails', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(mockQueryResult({ count: 0 }))
      .mockResolvedValueOnce(mockQueryResult({ predicate: false }))
    mockSession.executeWrite.mockRejectedValueOnce(new Error('write failed'))
    await expect(
      directoryMutation.CreateMember(null, args, context)
    ).rejects.toThrow('write failed')
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })
})

describe('UpdateMemberBacenta session cleanup', () => {
  const moveArgs = { memberId: 'member_1', bacentaId: 'bacenta_1' }
  const memberProps = { id: 'member_1', firstName: 'Ama' }

  it('closes the session after moving the member', async () => {
    mockSession.executeWrite.mockResolvedValueOnce({
      records: [{ get: () => ({ properties: memberProps }) }],
    })
    await directoryMutation.UpdateMemberBacenta(null, moveArgs, context)
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })

  it('closes the session when the database write fails', async () => {
    mockSession.executeWrite.mockRejectedValueOnce(new Error('write failed'))
    await expect(
      directoryMutation.UpdateMemberBacenta(null, moveArgs, context)
    ).rejects.toThrow('write failed')
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })
})

describe('SYN-207 — UpdateMemberDetails: assertScopeViaMember gating', () => {
  it('SYN-207: calls assertScopeViaMember with args.id before writing', async () => {
    await directoryMutation.UpdateMemberDetails(null, updateArgs, context)

    expect(assertScopeViaMember).toHaveBeenCalledWith(
      context,
      'member_target_1'
    )
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
  })

  it('SYN-207: runs isAuth(permitLeaderAdmin(Bacenta)) before the scope check', async () => {
    await directoryMutation.UpdateMemberDetails(null, updateArgs, context)

    expect(isAuth).toHaveBeenCalledWith(expect.any(Array), mockJwt.roles)
    expect((isAuth as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (assertScopeViaMember as jest.Mock).mock.invocationCallOrder[0]
    )
  })

  it('SYN-207: blocks the write when the target member is out of the caller scope', async () => {
    const forbidden = Object.assign(new Error('FORBIDDEN'), {
      extensions: { code: 'FORBIDDEN' },
    })
    ;(assertScopeViaMember as jest.Mock).mockRejectedValueOnce(forbidden)

    await expect(
      directoryMutation.UpdateMemberDetails(null, updateArgs, context)
    ).rejects.toThrow('FORBIDDEN')

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
    expect(mockSession.close).not.toHaveBeenCalled()
  })

  it('SYN-207: writes via the updateMemberDetails Cypher, keyed on args.id', async () => {
    await directoryMutation.UpdateMemberDetails(null, updateArgs, context)

    expect(mockSession.executeWrite).toHaveBeenCalledWith(expect.any(Function))

    const executeWriteCallback = mockSession.executeWrite.mock.calls[0][0]
    const fakeTx = { run: jest.fn().mockResolvedValue({ records: [] }) }
    await executeWriteCallback(fakeTx)

    expect(fakeTx.run).toHaveBeenCalledWith(
      updateMemberDetails,
      expect.objectContaining({ id: 'member_target_1' })
    )
  })
})

/**
 * SYN-210 — the same IDOR class as SYN-207, one verb up.
 *
 * MakeMemberInactive gates on isAuth(permitLeaderAdmin('Governorship')) only,
 * which proves the caller holds a governorship-level role SOMEWHERE, not that
 * it covers the target. The checkMemberHasNoActiveRelationships pre-check is
 * not a scope gate — it only blocks members who hold a servant edge, so every
 * ordinary member org-wide was deactivatable by any governorship-level leader,
 * and a reason containing "duplicate" routes to the more destructive
 * removeDuplicateMember. This block pins:
 *
 *   - assertScopeViaMember is called with args.id, after isAuth
 *   - a FORBIDDEN aborts before the relationship read AND before any write
 *   - the "duplicate" branch is gated too (it must not bypass the scope check)
 *   - the happy path still writes via makeMemberInactive, keyed on args.id
 *
 *   npm test -- directory-resolvers --testNamePattern="SYN-210:"
 */
describe('SYN-210 — MakeMemberInactive: assertScopeViaMember gating', () => {
  const inactiveArgs = { id: 'member_target_1', reason: 'left the church' }

  // MakeMemberInactive is Governorship-gated, so the caller fixture must hold a
  // governorship-level role. The shared `leaderBacenta` jwt above would only
  // reach the resolver body because `isAuth` is mocked.
  const govJwt = { ...mockJwt, roles: ['leaderGovernorship'] as const }

  beforeEach(() => {
    context = {
      jwt: govJwt,
      executionContext: { session: jest.fn().mockReturnValue(mockSession) },
    } as unknown as Context

    // MakeMemberInactive reads checkMemberHasNoActiveRelationships first and
    // dereferences `relationshipCount.low`; 0 = target holds no servant edge,
    // i.e. the pre-check passes and only the scope gate stands between the
    // caller and the write.
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValue(mockQueryResult({ relationshipCount: { low: 0 } }))
    mockSession.executeWrite = jest
      .fn()
      .mockResolvedValue(
        mockQueryResult({ member: { properties: { id: 'member_target_1' } } })
      )
  })

  it('SYN-210: calls assertScopeViaMember with args.id before writing', async () => {
    await directoryMutation.MakeMemberInactive(null, inactiveArgs, context)

    expect(assertScopeViaMember).toHaveBeenCalledWith(
      context,
      'member_target_1'
    )
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
  })

  it('SYN-210: runs isAuth(permitLeaderAdmin(Governorship)) before the scope check', async () => {
    await directoryMutation.MakeMemberInactive(null, inactiveArgs, context)

    // Pin the actual permission array, not expect.any(Array): a silent
    // downgrade to a looser helper (e.g. permitMe) would otherwise stay green
    // while re-opening this mutation to arrivals/teller roles.
    expect(isAuth).toHaveBeenCalledWith(
      permitLeaderAdmin('Governorship'),
      govJwt.roles
    )
    expect((isAuth as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (assertScopeViaMember as jest.Mock).mock.invocationCallOrder[0]
    )
  })

  it('SYN-210: blocks the deactivation when the target member is out of the caller scope', async () => {
    const forbidden = Object.assign(new Error('FORBIDDEN'), {
      extensions: { code: 'FORBIDDEN' },
    })
    ;(assertScopeViaMember as jest.Mock).mockRejectedValueOnce(forbidden)

    await expect(
      directoryMutation.MakeMemberInactive(null, inactiveArgs, context)
    ).rejects.toThrow('FORBIDDEN')

    // The gate runs before the session is opened, so nothing is read, nothing
    // is written, and no session is leaked. Assert the session was never
    // requested at all — a future regression that opens it before the gate
    // would slip past a close()-only check.
    expect(context.executionContext.session).not.toHaveBeenCalled()
    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-210: blocks the more destructive "duplicate" branch too', async () => {
    const forbidden = Object.assign(new Error('FORBIDDEN'), {
      extensions: { code: 'FORBIDDEN' },
    })
    ;(assertScopeViaMember as jest.Mock).mockRejectedValueOnce(forbidden)

    await expect(
      directoryMutation.MakeMemberInactive(
        null,
        { id: 'member_target_1', reason: 'duplicate account' },
        context
      )
    ).rejects.toThrow('FORBIDDEN')

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-210: in-scope caller still writes via makeMemberInactive, keyed on args.id', async () => {
    await directoryMutation.MakeMemberInactive(null, inactiveArgs, context)

    const executeWriteCallback = mockSession.executeWrite.mock.calls[0][0]
    const fakeTx = { run: jest.fn().mockResolvedValue({ records: [] }) }
    await executeWriteCallback(fakeTx)

    expect(fakeTx.run).toHaveBeenCalledWith(
      makeMemberInactive,
      expect.objectContaining({ id: 'member_target_1' })
    )
  })

  // SYN-227 — a member who still holds a servant edge is a user-correctable
  // rejection. It used to throw a plain Error, which Apollo surfaced (and the
  // error-reference plugin logged) as INTERNAL_SERVER_ERROR. The refusal also
  // names each blocking role in extensions.activeRoles for the delete dialog.
  const activeRoles = [
    { servantType: 'Leader', churchType: 'Bacenta', churchName: 'Adenta' },
    { servantType: 'Admin', churchType: 'Governorship', churchName: 'Madina' },
  ]

  it('SYN-227: rejects a member with active roles as BAD_USER_INPUT, not an internal error', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValue(
        mockQueryResult({ relationshipCount: { low: 2 }, activeRoles })
      )

    const error = await directoryMutation
      .MakeMemberInactive(null, inactiveArgs, context)
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(GraphQLError)
    expect(error).toMatchObject({
      message:
        'This member has active roles in church. Please remove all active roles and try again',
      extensions: { code: 'BAD_USER_INPUT', severity: 'USER_ERROR' },
    })
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
    expect(mockSession.close).toHaveBeenCalled()
  })

  it('SYN-227: the refusal lists every blocking role in extensions.activeRoles', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValue(
        mockQueryResult({ relationshipCount: { low: 2 }, activeRoles })
      )

    const error = (await directoryMutation
      .MakeMemberInactive(null, inactiveArgs, context)
      .catch((e: unknown) => e)) as GraphQLError

    expect(error.extensions.activeRoles).toEqual(activeRoles)
    // The roles ride in extensions only: the message (logged by the
    // error-reference plugin) must not carry church names.
    expect(error.message).not.toContain('Adenta')
    expect(error.message).not.toContain('Madina')
  })

  it('SYN-227: still refuses, with an empty list, when the read returns no activeRoles column', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValue(mockQueryResult({ relationshipCount: { low: 1 } }))

    const error = (await directoryMutation
      .MakeMemberInactive(null, inactiveArgs, context)
      .catch((e: unknown) => e)) as GraphQLError

    expect(error).toBeInstanceOf(GraphQLError)
    expect(error.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      activeRoles: [],
    })
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-227: reads the roles through checkMemberHasNoActiveRelationships, keyed on args.id', async () => {
    await directoryMutation.MakeMemberInactive(null, inactiveArgs, context)

    const executeReadCallback = mockSession.executeRead.mock.calls[0][0]
    const fakeTx = { run: jest.fn().mockResolvedValue({ records: [] }) }
    await executeReadCallback(fakeTx)

    expect(fakeTx.run).toHaveBeenCalledWith(
      checkMemberHasNoActiveRelationships,
      expect.objectContaining({ id: 'member_target_1' })
    )
  })

  it('SYN-227: a member with no active roles passes the guard and is written', async () => {
    await expect(
      directoryMutation.MakeMemberInactive(null, inactiveArgs, context)
    ).resolves.toEqual({ id: 'member_target_1' })
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
  })

  it('SYN-210: in-scope caller with a "duplicate" reason still routes to removeDuplicateMember', async () => {
    await directoryMutation.MakeMemberInactive(
      null,
      { id: 'member_target_1', reason: 'Duplicate record' },
      context
    )

    const executeWriteCallback = mockSession.executeWrite.mock.calls[0][0]
    const fakeTx = { run: jest.fn().mockResolvedValue({ records: [] }) }
    await executeWriteCallback(fakeTx)

    expect(fakeTx.run).toHaveBeenCalledWith(
      removeDuplicateMember,
      expect.objectContaining({ id: 'member_target_1' })
    )
  })
})

/**
 * SYN-236 — CloseDownBacenta's pre-checks are user errors, not Lambda ERRORs.
 *
 * "Bacenta still has members" and "offering not yet banked" are expected
 * refusals the admin resolves themselves. They used to be plain Errors that
 * the catch routed through throwToSentry, which console.error'd every attempt
 * into CloudWatch (and the error-intake bot filed it as a bug). They are now
 * classified BAD_USER_INPUT and rethrown untouched; genuinely unexpected
 * failures still go through throwToSentry.
 */
describe('SYN-236 — CloseDownBacenta: pre-check refusals are classified user errors', () => {
  const closeArgs = { bacentaId: 'bacenta_1', leaderId: '' }
  let consoleErrorSpy: jest.SpyInstance

  const mockReads = (
    memberCount: number,
    lastService: Record<string, unknown> | null
  ) => {
    // Promise.all fires checkBacentaHasNoMembers first, getLastServiceRecord
    // second, so the Once-queue order matches the resolver's call order.
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValueOnce(
        mockQueryResult({ name: 'Test', memberCount, hasGovernorship: true })
      )
      .mockResolvedValueOnce(
        lastService
          ? mockQueryResult({ lastService: { properties: lastService } })
          : { records: [] }
      )
  }

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockSession.executeWrite = jest
      .fn()
      .mockResolvedValue(mockQueryResult({ governorship: { id: 'gov_1' } }))
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('SYN-236: refuses a bacenta with members as BAD_USER_INPUT without logging an error', async () => {
    mockReads(2, null)

    const error = await directoryMutation
      .CloseDownBacenta(null, closeArgs, context)
      .catch((e: unknown) => e)

    expect(error).toMatchObject({
      message:
        'Test Bacenta has 2 members. Please transfer all members and try again.',
      extensions: { code: 'BAD_USER_INPUT' },
    })
    expect(assertCan).toHaveBeenCalledWith(
      context,
      expect.any(Array),
      'bacenta_1'
    )
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
    expect(mockSession.close).toHaveBeenCalled()
  })

  it('SYN-236: refuses an unbanked last service as BAD_USER_INPUT without logging an error', async () => {
    mockReads(0, { createdAt: '2026-11-15T10:00:00.000Z' })

    const error = await directoryMutation
      .CloseDownBacenta(null, closeArgs, context)
      .catch((e: unknown) => e)

    expect(error).toMatchObject({
      message: expect.stringContaining('Please bank outstanding offering'),
      extensions: { code: 'BAD_USER_INPUT' },
    })
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  // SYN-253 supersedes the old "throwToSentry logs it" expectation: the
  // resolver only rethrows (cause attached) and the GraphQL error logger
  // writes the single ERROR line for it.
  it('SYN-236: unexpected failures still go through throwToSentry', async () => {
    mockReads(0, null)
    const dbError = new Error('Neo4j unavailable')
    mockSession.executeWrite = jest.fn().mockRejectedValue(dbError)

    const error = await directoryMutation
      .CloseDownBacenta(null, closeArgs, context)
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe(
      'Error closing down bacenta: Neo4j unavailable'
    )
    expect((error as { extensions?: unknown }).extensions).toBeUndefined()
    expect((error as Error & { cause?: unknown }).cause).toBe(dbError)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('SYN-236: an empty, banked bacenta still closes down', async () => {
    mockReads(0, { bankingSlip: 'slip.png' })

    await expect(
      directoryMutation.CloseDownBacenta(null, closeArgs, context)
    ).resolves.toEqual({ id: 'gov_1' })
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})

/**
 * SYN-252 — CloseDownBacenta must never resolve to null.
 *
 * The close-down Cypher only matches an active :Bacenta under a Governorship,
 * so closing an id that is already a ClosedBacenta (a repeated close, or a
 * RetryLink replay after a lost response) or an orphaned bacenta produced zero
 * rows, and the resolver returned null for the non-nullable
 * Mutation.CloseDownBacenta. Refusals must land before RemoveServant commits.
 */
describe('SYN-252 — CloseDownBacenta: no null result for the non-nullable mutation', () => {
  const closeArgs = { bacentaId: 'bacenta_1', leaderId: 'leader_1' }
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('SYN-252: refuses an already-closed bacenta as BAD_USER_INPUT before RemoveServant or any write', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValueOnce({ records: [] }) // checkBacentaHasNoMembers: not :Bacenta
      .mockResolvedValueOnce({ records: [] }) // getLastServiceRecord
      .mockResolvedValueOnce(mockQueryResult({ name: 'Test' })) // checkBacentaAlreadyClosed
    mockSession.executeWrite = jest.fn()

    const error = await directoryMutation
      .CloseDownBacenta(null, closeArgs, context)
      .catch((e: unknown) => e)

    expect(error).toMatchObject({
      message: 'Test Bacenta has already been closed down.',
      extensions: { code: 'BAD_USER_INPUT' },
    })
    expect(mockSession.executeRead).toHaveBeenCalledTimes(3)
    expect(RemoveServant).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('SYN-252: refuses an unknown bacenta id as BAD_USER_INPUT before RemoveServant or any write', async () => {
    mockSession.executeRead = jest.fn().mockResolvedValue({ records: [] })
    mockSession.executeWrite = jest.fn()

    const error = await directoryMutation
      .CloseDownBacenta(null, closeArgs, context)
      .catch((e: unknown) => e)

    expect(error).toMatchObject({
      message: 'This bacenta could not be found.',
      extensions: { code: 'BAD_USER_INPUT' },
    })
    expect(RemoveServant).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-252: refuses a bacenta with no parent Governorship before RemoveServant detaches its leader', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValueOnce(
        mockQueryResult({ name: 'Test', memberCount: 0, hasGovernorship: false })
      )
      .mockResolvedValueOnce({ records: [] })
    mockSession.executeWrite = jest.fn()

    const error = await directoryMutation
      .CloseDownBacenta(null, closeArgs, context)
      .catch((e: unknown) => e)

    expect(error).toMatchObject({
      message: expect.stringContaining('is not under a Governorship'),
      extensions: { code: 'BAD_USER_INPUT' },
    })
    expect(RemoveServant).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('SYN-252: a concurrent duplicate whose write matches nothing gets the already-closed user error', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValueOnce(
        mockQueryResult({ name: 'Test', memberCount: 0, hasGovernorship: true })
      )
      .mockResolvedValueOnce({ records: [] })
      .mockResolvedValueOnce(mockQueryResult({ name: 'Test' })) // closed by the winner
    mockSession.executeWrite = jest.fn().mockResolvedValue({ records: [] })

    const error = await directoryMutation
      .CloseDownBacenta(null, closeArgs, context)
      .catch((e: unknown) => e)

    expect(error).toMatchObject({
      message: 'Test Bacenta has already been closed down.',
      extensions: { code: 'BAD_USER_INPUT' },
    })
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  // SYN-253 supersedes the old "the resolver logs it" expectation: the error
  // carries no code, so it surfaces as INTERNAL_SERVER_ERROR and the GraphQL
  // error logger writes the single ERROR line for it.
  it('SYN-252: any other zero-row close-down write throws a logged error instead of returning null', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValueOnce(
        mockQueryResult({ name: 'Test', memberCount: 0, hasGovernorship: true })
      )
      .mockResolvedValueOnce({ records: [] })
      .mockResolvedValueOnce({ records: [] }) // not closed either
    mockSession.executeWrite = jest.fn().mockResolvedValue({ records: [] })

    const error = await directoryMutation
      .CloseDownBacenta(null, closeArgs, context)
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe(
      'Error closing down bacenta: Close-down matched no active bacenta, governorship or admin member'
    )
    expect((error as { extensions?: unknown }).extensions).toBeUndefined()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(mockSession.close).toHaveBeenCalled()
  })

  it('SYN-252: a healthy close-down detaches the leader, writes once and returns the governorship', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValueOnce(
        mockQueryResult({ name: 'Test', memberCount: 0, hasGovernorship: true })
      )
      .mockResolvedValueOnce({ records: [] })
    mockSession.executeWrite = jest
      .fn()
      .mockResolvedValue(
        mockQueryResult({ governorship: { id: 'gov_1', bacentas: [] } })
      )

    await expect(
      directoryMutation.CloseDownBacenta(null, closeArgs, context)
    ).resolves.toEqual({ id: 'gov_1', bacentas: [] })
    expect(RemoveServant).toHaveBeenCalledTimes(1)
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
  })
})

/**
 * SYN-253 — the remaining user-facing refusals in this file are classified
 * BAD_USER_INPUT (so the GraphQL logger records them at WARN) with the exact
 * message users saw before, and nothing is logged by the resolver itself.
 */
describe('SYN-253 — directory refusals are BAD_USER_INPUT with unchanged messages', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  const expectRefusal = async (promise: Promise<unknown>, message: string) => {
    const error = await promise.catch((e: unknown) => e)
    expect(error).toMatchObject({
      message,
      extensions: { code: 'BAD_USER_INPUT' },
    })
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  }

  it('SYN-253: MakeMemberInactive refuses a member with active roles', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValue(mockQueryResult({ relationshipCount: { low: 2 } }))

    await expectRefusal(
      directoryMutation.MakeMemberInactive(
        null,
        { id: 'member_target_1', reason: 'moved' },
        context
      ),
      'This member has active roles in church. Please remove all active roles and try again'
    )
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-253: CreateMember refuses a duplicate email', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValueOnce({ records: [] })
      .mockResolvedValueOnce(
        mockQueryResult({
          predicate: true,
          member: {
            properties: {
              email: 'dup@example.test',
              firstName: 'First',
              lastName: 'Last',
            },
          },
        })
      )

    await expectRefusal(
      directoryMutation.CreateMember(
        null,
        {
          email: 'dup@example.test',
          bacenta: 'bacenta_1',
        } as unknown as Member,
        context
      ),
      'There is a member with this email "dup@example.test" called First Last'
    )
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-253: CreateMember refuses a duplicate whatsapp number', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValueOnce({ records: [] })
      .mockResolvedValueOnce(
        mockQueryResult({
          predicate: true,
          member: {
            properties: {
              email: 'other@example.test',
              whatsappNumber: '0200000000',
              firstName: 'First',
              lastName: 'Last',
            },
          },
        })
      )

    await expectRefusal(
      directoryMutation.CreateMember(
        null,
        {
          email: 'new@example.test',
          whatsappNumber: '0200000000',
          bacenta: 'bacenta_1',
        } as unknown as Member,
        context
      ),
      'There is a member with this whatsapp number "0200000000" called First Last'
    )
  })

  // Close-downs above Bacenta still wrap their refusals in throwToSentry, so
  // the user keeps seeing the "Error closing down <level>: " prefix — only
  // the code changes.
  it('SYN-253: CloseDownGovernorship keeps its prefixed message but is BAD_USER_INPUT', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValueOnce(
        mockQueryResult({
          name: 'Test',
          // Neo4j Integer: numeric check via toNumber, message via toString.
          bacentaCount: { toNumber: () => 3, toString: () => '3' },
        })
      )
      .mockResolvedValueOnce({ records: [] })

    await expectRefusal(
      directoryMutation.CloseDownGovernorship(
        null,
        { governorshipId: 'gov_1' },
        context
      ),
      'Error closing down governorship: Test Governorship has 3 active bacentas. Please close down all bacentas and try again.'
    )
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-253: CloseDownGovernorship refuses an unbanked last service', async () => {
    mockSession.executeRead = jest
      .fn()
      .mockResolvedValueOnce(
        mockQueryResult({ name: 'Test', bacentaCount: { toNumber: () => 0 } })
      )
      .mockResolvedValueOnce(
        mockQueryResult({
          lastService: { properties: { createdAt: '2026-11-01T10:00:00Z' } },
        })
      )

    const error = await directoryMutation
      .CloseDownGovernorship(null, { governorshipId: 'gov_1' }, context)
      .catch((e: unknown) => e)

    expect(error).toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } })
    expect((error as Error).message).toMatch(
      /^Error closing down governorship: Please bank outstanding offering for your service filled on .+ before attempting to close down this governorship$/
    )
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  const n = (value: number) => ({
    toNumber: () => value,
    toString: () => String(value),
  })
  const levels = [
    {
      resolver: 'CloseDownGovernorship',
      args: { governorshipId: 'c_1' },
      noun: 'governorship',
      counts: { bacentaCount: n(0) },
    },
    {
      resolver: 'CloseDownCouncil',
      args: { councilId: 'c_1' },
      noun: 'council',
      counts: { governorshipCount: n(0) },
    },
    {
      resolver: 'CloseDownStream',
      args: { streamId: 'c_1' },
      noun: 'stream',
      counts: { councilCount: n(0), ministryCount: n(0) },
    },
    {
      resolver: 'CloseDownCampus',
      args: { campusId: 'c_1' },
      noun: 'campus',
      counts: { streamCount: n(0) },
    },
    {
      resolver: 'CloseDownOversight',
      args: { oversightId: 'c_1' },
      noun: 'oversight',
      counts: { campusCount: n(0) },
    },
  ] as const

  const closeDown = (resolver: string, args: Record<string, string>) =>
    (
      directoryMutation as unknown as Record<
        string,
        (o: null, a: unknown, c: Context) => Promise<unknown>
      >
    )[resolver](null, args, context)

  it.each([
    [
      'CloseDownCouncil',
      { councilId: 'c_1' },
      { governorshipCount: n(2) },
      'Error closing down council: Test Council has 2 active governorships. Please close down all governorships and try again.',
    ],
    [
      'CloseDownStream',
      { streamId: 'c_1' },
      { councilCount: n(2), ministryCount: n(0) },
      'Error closing down stream: Test Stream has 2 active councils. Please close down all councils and try again.',
    ],
    [
      'CloseDownStream',
      { streamId: 'c_1' },
      { councilCount: n(0), ministryCount: n(2) },
      'Error closing down stream: Test Stream has 2 active ministries. Please close down all ministries and try again.',
    ],
    [
      'CloseDownCampus',
      { campusId: 'c_1' },
      { streamCount: n(2) },
      'Error closing down campus: Test Campus has 2 active streams. Please close down all streams and try again.',
    ],
    [
      'CloseDownOversight',
      { oversightId: 'c_1' },
      { campusCount: n(2) },
      'Error closing down oversight: Test Oversight has 2 active campuses. Please close down all campuses and try again.',
    ],
  ])(
    'SYN-253: %s refuses a church with active children as BAD_USER_INPUT, same message',
    async (resolver, args, counts, message) => {
      mockSession.executeRead = jest
        .fn()
        .mockResolvedValueOnce(mockQueryResult({ name: 'Test', ...counts }))
        .mockResolvedValueOnce({ records: [] })

      await expectRefusal(closeDown(resolver, args), message)
      expect(mockSession.executeWrite).not.toHaveBeenCalled()
    }
  )

  it.each(levels)(
    'SYN-253: $resolver refuses an unbanked last service as BAD_USER_INPUT',
    async ({ resolver, args, noun, counts }) => {
      mockSession.executeRead = jest
        .fn()
        .mockResolvedValueOnce(mockQueryResult({ name: 'Test', ...counts }))
        .mockResolvedValueOnce(
          mockQueryResult({
            lastService: { properties: { createdAt: '2026-11-01T10:00:00Z' } },
          })
        )

      const error = await closeDown(resolver, args).catch((e: unknown) => e)

      expect(error).toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } })
      expect((error as Error).message).toMatch(
        new RegExp(
          `^Error closing down ${noun}: Please bank outstanding offering for your service filled on .+ before attempting to close down this ${noun}$`
        )
      )
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(mockSession.executeWrite).not.toHaveBeenCalled()
    }
  )
})

// ---------------------------------------------------------------------------
// SYN-290 — SetMemberStickyNote: a refusal, never a null non-null field
// ---------------------------------------------------------------------------
describe('SYN-290 — SetMemberStickyNote: scope-gated custom resolver', () => {
  const noteArgs = { memberId: 'member_target_1', stickyNote: 'Call on Sunday' }

  beforeEach(() => {
    mockSession.executeWrite = jest.fn().mockResolvedValue({
      records: [
        {
          get: () => ({
            properties: { id: 'member_target_1', stickyNote: 'Call on Sunday' },
          }),
        },
      ],
    })
  })

  it('SYN-290: runs isAuth(permitLeaderAdmin(Bacenta)) before the scope check', async () => {
    await directoryMutation.SetMemberStickyNote(null as any, noteArgs, context)

    expect(isAuth).toHaveBeenCalledWith(
      permitLeaderAdmin('Bacenta'),
      mockJwt.roles
    )
    expect(assertScopeViaMember).toHaveBeenCalledWith(
      context,
      'member_target_1'
    )
    expect((isAuth as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (assertScopeViaMember as jest.Mock).mock.invocationCallOrder[0]
    )
  })

  it('SYN-290: writes the note keyed on memberId and returns the member', async () => {
    const result = await directoryMutation.SetMemberStickyNote(
      null as any,
      noteArgs,
      context
    )

    expect(result).toEqual({
      id: 'member_target_1',
      stickyNote: 'Call on Sunday',
    })
    const run = jest.fn().mockResolvedValue({ records: [] })
    await mockSession.executeWrite.mock.calls[0][0]({ run })
    expect(run).toHaveBeenCalledWith(setMemberStickyNote, {
      id: 'member_target_1',
      stickyNote: 'Call on Sunday',
    })
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })

  it('SYN-290: an out-of-scope member is refused with FORBIDDEN before any session opens', async () => {
    const forbidden = new GraphQLError('not permitted', {
      extensions: { code: 'FORBIDDEN' },
    })
    ;(assertScopeViaMember as jest.Mock).mockRejectedValueOnce(forbidden)

    await expect(
      directoryMutation.SetMemberStickyNote(null as any, noteArgs, context)
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } })
    expect(context.executionContext.session).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-290: a write that matches no member throws BAD_USER_INPUT instead of returning null', async () => {
    mockSession.executeWrite.mockResolvedValueOnce({ records: [] })

    const call = directoryMutation.SetMemberStickyNote(
      null as any,
      { memberId: 'member_target_1', stickyNote: '' },
      context
    )
    await expect(call).rejects.toMatchObject({
      extensions: { code: 'BAD_USER_INPUT' },
    })
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })

  it('SYN-290: an unexpected write failure goes through throwToSentry', async () => {
    const dbError = new Error('Neo4j unavailable')
    mockSession.executeWrite.mockRejectedValueOnce(dbError)

    const error = await directoryMutation
      .SetMemberStickyNote(null as any, noteArgs, context)
      .catch((e: unknown) => e)

    expect((error as Error).message).toBe(
      'Error saving sticky note: Neo4j unavailable'
    )
    expect((error as Error & { cause?: unknown }).cause).toBe(dbError)
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })

  it('SYN-290: the SDL field has no @cypher block, so the resolver above serves it', () => {
    const sdl = fs.readFileSync(
      path.join(__dirname, '../../schema/directory-history.graphql'),
      'utf8'
    )
    // The field runs from its declaration to the next blank line.
    const fieldStart = sdl.indexOf('SetMemberStickyNote(')
    expect(fieldStart).toBeGreaterThan(-1)
    const fieldEnd = sdl.indexOf('\n\n', fieldStart)
    expect(fieldEnd).toBeGreaterThan(fieldStart)
    const field = sdl.slice(fieldStart, fieldEnd)

    expect(field).toContain(
      'SetMemberStickyNote(memberId: ID!, stickyNote: String!): Member!'
    )
    expect(field).not.toContain('@cypher')
    expect(field).not.toContain('allowedChurchIds')
  })
})
