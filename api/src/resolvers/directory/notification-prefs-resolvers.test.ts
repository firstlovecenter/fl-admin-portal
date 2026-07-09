/**
 * Unit tests for the per-category notification-preference resolvers.
 *
 * Focus: the DEFAULTERS category added alongside SERVICES / BANKING / ARRIVALS
 * — that it is read back, that setting it targets `notifyDefaulters` via the
 * $category param (never an interpolated property name), that an unset flag
 * defaults ON, and that an unknown category is rejected.
 *
 * isAuth is mocked to a no-op so the permitMe gate doesn't need a full JWT;
 * throwToSentry is left real so the invalid-input path actually throws.
 */

import {
  myNotificationPreferences,
  SetNotificationPreference,
} from './notification-prefs-resolvers'
import {
  READ_NOTIFICATION_PREFERENCES,
  SET_NOTIFICATION_PREFERENCE,
} from './notification-prefs-cypher'
import type { Context } from '../utils/neo4j-types'

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
}))

// A neo4j record: `.get(key)` reads the aliased return column.
const makeResult = (data: Record<string, boolean> | null) => ({
  records: data ? [{ get: (key: string) => data[key] }] : [],
})

const mockJwt = {
  userId: 'user_test',
  roles: ['leaderCouncil'],
} as unknown as Context['jwt']

let mockRun: jest.Mock
let mockSession: {
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context

beforeEach(() => {
  mockRun = jest.fn()
  mockSession = {
    // Invoke the unit-of-work with a tx exposing `run`, so we can assert the
    // exact query + params the resolver passed.
    executeRead: jest.fn((work) => work({ run: mockRun })),
    executeWrite: jest.fn((work) => work({ run: mockRun })),
    close: jest.fn().mockResolvedValue(undefined),
  }
  context = {
    jwt: mockJwt,
    executionContext: { session: jest.fn().mockReturnValue(mockSession) },
  } as unknown as Context
})

describe('myNotificationPreferences', () => {
  it('reads back all four categories including defaulters', async () => {
    mockRun.mockResolvedValue(
      makeResult({
        services: true,
        banking: false,
        defaulters: true,
        arrivals: false,
      })
    )

    const prefs = await myNotificationPreferences(null, {}, context)

    expect(mockRun).toHaveBeenCalledWith(READ_NOTIFICATION_PREFERENCES, {
      userId: 'user_test',
    })
    expect(prefs).toEqual({
      services: true,
      banking: false,
      defaulters: true,
      arrivals: false,
    })
  })

  it('defaults to fully subscribed (defaulters ON) when the member has no record', async () => {
    mockRun.mockResolvedValue(makeResult(null))

    const prefs = await myNotificationPreferences(null, {}, context)

    expect(prefs.defaulters).toBe(true)
    expect(prefs).toEqual({
      services: true,
      banking: true,
      defaulters: true,
      arrivals: true,
    })
  })
})

describe('SetNotificationPreference', () => {
  it('mutes DEFAULTERS via the $category param and returns the new flags', async () => {
    mockRun.mockResolvedValue(
      makeResult({
        services: true,
        banking: true,
        defaulters: false,
        arrivals: true,
      })
    )

    const prefs = await SetNotificationPreference(
      null,
      { category: 'DEFAULTERS', enabled: false },
      context
    )

    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
    expect(mockRun).toHaveBeenCalledWith(SET_NOTIFICATION_PREFERENCE, {
      userId: 'user_test',
      category: 'DEFAULTERS',
      enabled: false,
    })
    expect(prefs.defaulters).toBe(false)
  })

  it('rejects an unknown category without writing', async () => {
    await expect(
      SetNotificationPreference(
        null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { category: 'NONSENSE' as any, enabled: true },
        context
      )
    ).rejects.toThrow()

    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })
})
