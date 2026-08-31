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

import directoryMutation from './directory-resolvers'
import {
  updateMemberDetails,
  makeMemberInactive,
  removeDuplicateMember,
} from '../cypher/resolver-cypher'
import type { Context } from '../utils/neo4j-types'
import type { Member } from '../utils/types'
import { isAuth } from '../utils/utils'
import { assertScopeViaMember } from '../utils/scope-utils'
import { permitLeaderAdmin } from '../permissions'

jest.mock('../utils/scope-utils', () => ({
  assertChurchScope: jest.fn().mockResolvedValue(undefined),
  assertScopeViaMember: jest.fn().mockResolvedValue(undefined),
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

describe('SYN-207 — UpdateMemberDetails: assertScopeViaMember gating', () => {
  it('SYN-207: calls assertScopeViaMember with args.id before writing', async () => {
    await directoryMutation.UpdateMemberDetails(null, updateArgs, context)

    expect(assertScopeViaMember).toHaveBeenCalledWith(context, 'member_target_1')
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

    expect(assertScopeViaMember).toHaveBeenCalledWith(context, 'member_target_1')
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
