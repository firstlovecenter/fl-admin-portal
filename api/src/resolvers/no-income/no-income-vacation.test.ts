/**
 * SM3 — Characterization tests for vacation-status refusal in no-income/service-resolvers.ts
 *
 * SM3 (kb/04-state-machines.md): A vacation Bacenta is not a defaulter and must
 * not be allowed to fill any service form (including the no-income form).
 *
 * All test names begin with "SM3:" for grep-ability (SYN-68):
 *   npm test -- no-income-vacation --testNamePattern="SM3:"
 */

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
}))

jest.mock('../directory/utils', () => ({
  makeServantCypher: jest.fn().mockResolvedValue(undefined),
}))

import serviceNoIncomeMutations from './service-resolvers'
import type { Context } from '../utils/neo4j-types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMockQueryResult = (data: Record<string, unknown>) => ({
  records: [{ keys: Object.keys(data), _fields: Object.values(data) }],
})

const VACATION_ERROR =
  'You cannnot have service if you are on vacation. Please conntact your admin!'

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
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context

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
// RecordServiceNoIncome — vacation refusal
// ---------------------------------------------------------------------------
describe('SM3 — RecordServiceNoIncome: vacation refusal', () => {
  const noIncomeArgs = {
    id: 'bacenta_1',
    churchId: 'bacenta_1',
  }

  it('SM3: RecordServiceNoIncome throws when checkFormFilledThisWeek labels include Vacation', async () => {
    // checkCurrentServiceLog → exists = true (skip servant history creation)
    mockSession.executeRead
      .mockResolvedValueOnce(makeMockQueryResult({ exists: true }))
      // checkFormFilledThisWeek → vacation labels
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: false, labels: ['Vacation', 'Bacenta'] })
      )

    await expect(
      serviceNoIncomeMutations.RecordServiceNoIncome(null, noIncomeArgs, context)
    ).rejects.toThrow(VACATION_ERROR)
  })

  it('SM3: vacation Bacenta is NOT a defaulter — it cannot fill no-income form either (executeWrite never called)', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(makeMockQueryResult({ exists: true }))
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: false, labels: ['Vacation', 'Bacenta'] })
      )

    await expect(
      serviceNoIncomeMutations.RecordServiceNoIncome(null, noIncomeArgs, context)
    ).rejects.toThrow()

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SM3: RecordServiceNoIncome succeeds for an active Bacenta (vacation check does not block)', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(makeMockQueryResult({ exists: true }))
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: false, labels: ['Active', 'Bacenta'] })
      )

    mockSession.executeWrite.mockResolvedValueOnce(
      makeMockQueryResult({ serviceRecord: { properties: { id: 'sr_new' } } })
    )

    await expect(
      serviceNoIncomeMutations.RecordServiceNoIncome(null, noIncomeArgs, context)
    ).resolves.toMatchObject({ id: 'sr_new' })
  })
})
