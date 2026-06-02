/**
 * SM3 — Characterization tests for vacation-status refusal in service-resolvers.ts
 *
 * SM3 (kb/04-state-machines.md): A Bacenta with vacationStatus = 'Vacation'
 * must NOT be flagged as a defaulter. In Neo4j, SetVacationBacenta replaces the
 * :Active label with :Vacation (REMOVE bacenta:Active / SET bacenta:Vacation).
 *
 * This file pins the service-recording side of SM3:
 *   - RecordService refuses to write a record for a vacation Bacenta
 *   - RecordSpecialService refuses for a vacation Bacenta
 *   - RecordCancelledService refuses for a vacation Bacenta
 *
 * The defaulter-list side is pinned via label-constraint tests in
 * defaulters-sm3.test.ts and treasury-sm3.test.ts.
 *
 * All test names begin with "SM3:" for grep-ability (SYN-68):
 *   npm test -- service-vacation --testNamePattern="SM3:"
 */

jest.mock('../utils/scope-utils', () => ({
  assertChurchScope: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
  throwToSentry: jest.fn((_msg: string, err: unknown) => {
    throw err
  }),
}))

jest.mock('../directory/utils', () => ({
  makeServantCypher: jest.fn().mockResolvedValue(undefined),
}))

import serviceMutation from './service-resolvers'
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

// Pin "now" to the same ISO week as the test fixtures' serviceDate
// (2024-01-07 is the Sunday in Mon Jan 1 → Sun Jan 7). Without this the
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
// RecordService — vacation refusal
// ---------------------------------------------------------------------------
describe('SM3 — RecordService: vacation refusal', () => {
  const baseArgs = {
    churchId: 'bacenta_1',
    serviceDate: '2024-01-07',
    attendance: 20,
    income: 100,
    foreignCurrency: '',
    numberOfTithers: 5,
    treasurers: ['member_1'],
    treasurerSelfie: 'https://img.jpg',
    familyPicture: 'https://img.jpg',
  }

  it('SM3: RecordService throws when church labels include Vacation', async () => {
    // checkServantHasCurrentHistory: checkCurrentServiceLog → exists = true
    mockSession.executeRead
      .mockResolvedValueOnce({ records: [{ get: jest.fn().mockReturnValue(true) }] })
      // Promise.all: checkFormFilledThisWeek → vacation labels
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: false, labels: ['Vacation', 'Bacenta'] })
      )
      // Promise.all: getCurrency
      .mockResolvedValueOnce(makeMockQueryResult({ conversionRateToDollar: 1 }))
      // Promise.all: getHigherChurches
      .mockResolvedValueOnce(makeMockQueryResult({}))

    await expect(serviceMutation.RecordService(null, baseArgs, context)).rejects.toThrow(
      VACATION_ERROR
    )
  })

  it('SM3: RecordService does NOT throw when church labels are Active (not Vacation)', async () => {
    // checkCurrentServiceLog → exists = true
    mockSession.executeRead
      .mockResolvedValueOnce({ records: [{ get: jest.fn().mockReturnValue(true) }] })
      // checkFormFilledThisWeek → active church
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: false, labels: ['Active', 'Bacenta'] })
      )
      // getCurrency
      .mockResolvedValueOnce(makeMockQueryResult({ conversionRateToDollar: 1, labels: ['Active', 'Bacenta'] }))
      // getHigherChurches
      .mockResolvedValueOnce(makeMockQueryResult({}))

    // executeWrite creates the service record — must use makeMockQueryResult so
    // rearrangeCypherObject can map keys → _fields correctly
    mockSession.executeWrite.mockResolvedValueOnce(
      makeMockQueryResult({ serviceRecord: { properties: { id: 'sr_new', attendance: 20 } } })
    )

    await expect(
      serviceMutation.RecordService(null, baseArgs, context)
    ).resolves.toMatchObject({ id: 'sr_new' })

    // executeWrite must have been called exactly once (the combined create+absorb+recompute tx)
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
  })

  it('SM3: vacation Bacentas cannot fill a service — executeWrite is never called', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce({ records: [{ get: jest.fn().mockReturnValue(true) }] })
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: false, labels: ['Vacation', 'Bacenta'] })
      )
      .mockResolvedValueOnce(makeMockQueryResult({ conversionRateToDollar: 1 }))
      .mockResolvedValueOnce(makeMockQueryResult({}))

    await expect(serviceMutation.RecordService(null, baseArgs, context)).rejects.toThrow()

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// RecordSpecialService — vacation refusal
// ---------------------------------------------------------------------------
describe('SM3 — RecordSpecialService: vacation refusal', () => {
  const specialArgs = {
    churchId: 'bacenta_1',
    serviceDate: '2024-01-07',
    attendance: 20,
    income: 100,
    foreignCurrency: '',
    numberOfTithers: 5,
    treasurers: ['member_1'],
    treasurerSelfie: 'https://img.jpg',
    familyPicture: 'https://img.jpg',
  }

  it('SM3: RecordSpecialService throws when getCurrency labels include Vacation', async () => {
    // checkCurrentServiceLog → exists = true (via checkServantHasCurrentHistory)
    mockSession.executeRead
      .mockResolvedValueOnce({ records: [{ get: jest.fn().mockReturnValue(true) }] })
      // Promise.all: getCurrency → vacation labels (RecordSpecialService checks currencyCheck.labels)
      .mockResolvedValueOnce(
        makeMockQueryResult({ conversionRateToDollar: 1, labels: ['Vacation', 'Bacenta'] })
      )
      // Promise.all: getHigherChurches
      .mockResolvedValueOnce(makeMockQueryResult({}))

    await expect(serviceMutation.RecordSpecialService(null, specialArgs, context)).rejects.toThrow(
      VACATION_ERROR
    )
  })

  it('SM3: vacation Bacentas cannot fill a special service — executeWrite is never called', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce({ records: [{ get: jest.fn().mockReturnValue(true) }] })
      .mockResolvedValueOnce(
        makeMockQueryResult({ conversionRateToDollar: 1, labels: ['Vacation', 'Bacenta'] })
      )
      .mockResolvedValueOnce(makeMockQueryResult({}))

    await expect(serviceMutation.RecordSpecialService(null, specialArgs, context)).rejects.toThrow()

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// RecordCancelledService — vacation refusal
// ---------------------------------------------------------------------------
describe('SM3 — RecordCancelledService: vacation refusal', () => {
  const cancelledArgs = {
    churchId: 'bacenta_1',
    serviceDate: '2024-01-07',
    noServiceReason: 'Public holiday',
  }

  it('SM3: RecordCancelledService throws when checkFormFilledThisWeek labels include Vacation', async () => {
    // checkCurrentServiceLog → exists = true
    mockSession.executeRead
      .mockResolvedValueOnce(makeMockQueryResult({ exists: true }))
      // checkFormFilledThisWeek → vacation labels
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: false, labels: ['Vacation', 'Bacenta'] })
      )

    // RecordCancelledService's vacation check is outside try/catch — propagates directly
    await expect(
      serviceMutation.RecordCancelledService(null, cancelledArgs, context)
    ).rejects.toThrow(VACATION_ERROR)
  })

  it('SM3: vacation Bacentas cannot fill a cancelled service — executeWrite is never called', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(makeMockQueryResult({ exists: true }))
      .mockResolvedValueOnce(
        makeMockQueryResult({ alreadyFilled: false, labels: ['Vacation', 'Bacenta'] })
      )

    await expect(serviceMutation.RecordCancelledService(null, cancelledArgs, context)).rejects.toThrow()

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })
})
