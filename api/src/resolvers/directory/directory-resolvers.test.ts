/**
 * SYN-207 — Characterization tests for UpdateMemberDetails's scope gate.
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
import { updateMemberDetails } from '../cypher/resolver-cypher'
import type { Context } from '../utils/neo4j-types'
import type { Member } from '../utils/types'
import { isAuth } from '../utils/utils'
import { assertScopeViaMember } from '../utils/scope-utils'

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
