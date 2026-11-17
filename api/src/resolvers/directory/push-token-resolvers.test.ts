/**
 * Unit tests for the self-scoped push-token mutations.
 *
 * SYN-230: RegisterPushToken was gated on `permitMe('Bacenta')`, which omits
 * Stream Arrivals Counters, Council Arrivals Payers and fishers-only members.
 * They could sign in and enable push, and every registration then failed with
 * FORBIDDEN. The gate is now `permitSelfService()`.
 *
 * isAuth is left REAL here (unlike notification-prefs-resolvers.test.ts) so
 * these tests exercise the actual role gate, not a mock of it.
 */

import { RegisterPushToken, UnregisterPushToken } from './push-token-resolvers'
import { REGISTER_PUSH_TOKEN, UNREGISTER_PUSH_TOKEN } from './push-token-cypher'
import type { Context } from '../utils/neo4j-types'

let mockRun: jest.Mock
let mockSession: { executeWrite: jest.Mock; close: jest.Mock }

const makeContext = (roles: string[], userId = 'user_test'): Context => {
  mockRun = jest.fn().mockResolvedValue({ records: [] })
  mockSession = {
    executeWrite: jest.fn((work) => work({ run: mockRun })),
    close: jest.fn().mockResolvedValue(undefined),
  }
  return {
    jwt: { userId, roles },
    executionContext: { session: jest.fn().mockReturnValue(mockSession) },
  } as unknown as Context
}

describe.each([
  ['RegisterPushToken', RegisterPushToken, REGISTER_PUSH_TOKEN],
  ['UnregisterPushToken', UnregisterPushToken, UNREGISTER_PUSH_TOKEN],
] as const)('%s', (_name, resolver, cypher) => {
  it.each([
    ['arrivalsCounterStream'],
    ['arrivalsPayerCouncil'],
    ['fishers'],
    ['tellerStream'],
    ['leaderBacenta'],
  ])('lets a %s-only member write their own token', async (role) => {
    const context = makeContext([role])

    await expect(resolver(null, { token: 'tok_abc' }, context)).resolves.toBe(
      true
    )

    expect(mockRun).toHaveBeenCalledWith(cypher, {
      userId: 'user_test',
      token: 'tok_abc',
    })
    expect(mockSession.close).toHaveBeenCalled()
  })

  it('rejects a roleless member with FORBIDDEN before opening a session', async () => {
    const context = makeContext([])

    await expect(
      resolver(null, { token: 'tok_abc' }, context)
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } })
    expect(context.executionContext.session).not.toHaveBeenCalled()
  })

  it('trims the token before writing it', async () => {
    const context = makeContext(['arrivalsCounterStream'])

    await resolver(null, { token: '  tok_abc  ' }, context)

    expect(mockRun).toHaveBeenCalledWith(cypher, {
      userId: 'user_test',
      token: 'tok_abc',
    })
  })

  it('rejects a blank token without writing', async () => {
    const context = makeContext(['arrivalsCounterStream'])

    await expect(resolver(null, { token: '   ' }, context)).rejects.toThrow()
    expect(mockRun).not.toHaveBeenCalled()
  })
})
