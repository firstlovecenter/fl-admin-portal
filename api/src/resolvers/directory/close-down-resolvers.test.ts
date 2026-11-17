/**
 * SYN-232 — CloseDown* guard refusals are user errors, not server faults.
 *
 * Closing a bacenta that still has members (or a governorship/council/...
 * that still has active sub-churches, or any church with unbanked offering)
 * is refused by a guard in the resolver. That refusal used to be a plain
 * `Error` which the catch block passed through `throwToSentry`: it was
 * console.error'd as "Error closing down bacenta: ..." — so the CloudWatch
 * error intake filed every ordinary refusal as an incident — and the user saw
 * the same internal prefix on the message.
 *
 * This file pins:
 *   - each guard throws BAD_USER_INPUT with the unprefixed message
 *   - a refusal is never console.error'd and never reaches the write
 *   - a genuine fault (e.g. the close-down write failing) is still logged
 *   - the happy path still closes the church
 *
 *   npm test -- close-down-resolvers --testNamePattern="SYN-232:"
 */

import { int } from 'neo4j-driver'
import directoryMutation from './directory-resolvers'
import type { Context } from '../utils/neo4j-types'

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
}))

jest.mock('../utils/assert-can', () => ({
  assertCan: jest.fn(),
}))

jest.mock('./make-remove-servants', () => ({
  RemoveServant: jest.fn().mockResolvedValue(undefined),
}))

const mockQueryResult = (data: Record<string, unknown>) => ({
  records: [{ keys: Object.keys(data), _fields: Object.values(data) }],
})

const bankedService = {
  lastService: {
    properties: { createdAt: '2026-11-01T10:00:00Z', bankingSlip: 'slip.jpg' },
  },
}
const unbankedService = {
  lastService: { properties: { createdAt: '2026-11-01T10:00:00Z' } },
}

let mockSession: {
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context
let errorLog: jest.SpyInstance

// CloseDown* runs two reads in parallel: the "no children" check first, then
// the last service record. Queue them in that order.
const queueReads = (
  check: Record<string, unknown>,
  lastService: Record<string, unknown> = bankedService
) => {
  mockSession.executeRead
    .mockResolvedValueOnce(mockQueryResult(check))
    .mockResolvedValueOnce(mockQueryResult(lastService))
}

beforeEach(() => {
  jest.clearAllMocks()
  errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined)

  mockSession = {
    executeRead: jest.fn(),
    executeWrite: jest
      .fn()
      .mockResolvedValue(mockQueryResult({ governorship: { id: 'gov_1' } })),
    close: jest.fn().mockResolvedValue(undefined),
  }
  context = {
    jwt: { userId: 'user_admin_1', roles: ['adminGovernorship'] },
    executionContext: { session: jest.fn().mockReturnValue(mockSession) },
  } as unknown as Context
})

afterEach(() => {
  errorLog.mockRestore()
})

const expectUserError = async (promise: Promise<unknown>, message: RegExp) => {
  const error = await promise.then(
    () => {
      throw new Error('expected the close-down to be refused')
    },
    (err) => err
  )
  expect(error.extensions?.code).toBe('BAD_USER_INPUT')
  expect(error.message).toMatch(message)
  expect(error.message).not.toMatch(/^Error closing down/)
  return error
}

describe('SYN-232 — CloseDownBacenta', () => {
  const args = { bacentaId: 'bacenta_1', leaderId: 'member_1' }

  it('SYN-232: refuses a bacenta with members as BAD_USER_INPUT without logging an error', async () => {
    queueReads({ name: 'Test', memberCount: int(15) })

    await expectUserError(
      directoryMutation.CloseDownBacenta(null, args, context),
      /^Test Bacenta has 15 members\. Please transfer all members/
    )

    expect(errorLog).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
    expect(mockSession.close).toHaveBeenCalledTimes(2)
  })

  it('SYN-232: refuses unbanked offering as BAD_USER_INPUT without logging an error', async () => {
    queueReads({ name: 'Test', memberCount: int(0) }, unbankedService)

    await expectUserError(
      directoryMutation.CloseDownBacenta(null, args, context),
      /^Please bank outstanding offering/
    )

    expect(errorLog).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-232: still logs and prefixes a genuine fault', async () => {
    queueReads({ name: 'Test', memberCount: int(0) })
    mockSession.executeWrite.mockRejectedValueOnce(new Error('db unavailable'))

    await expect(
      directoryMutation.CloseDownBacenta(null, args, context)
    ).rejects.toThrow('Error closing down bacenta: db unavailable')

    expect(errorLog).toHaveBeenCalledWith(
      'Error closing down bacenta: db unavailable'
    )
  })

  it('SYN-232: rethrows a FORBIDDEN from the leader removal unprefixed and unlogged', async () => {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const { RemoveServant } = require('./make-remove-servants')
    const forbidden = Object.assign(new Error('Not permitted'), {
      extensions: { code: 'FORBIDDEN' },
    })
    ;(RemoveServant as jest.Mock).mockRejectedValueOnce(forbidden)
    queueReads({ name: 'Test', memberCount: int(0) })

    await expect(
      directoryMutation.CloseDownBacenta(null, args, context)
    ).rejects.toBe(forbidden)

    expect(errorLog).not.toHaveBeenCalled()
  })

  it('SYN-232: an empty, banked bacenta still closes down', async () => {
    queueReads({ name: 'Test', memberCount: int(0) })

    const result = await directoryMutation.CloseDownBacenta(
      null,
      args,
      context
    )

    expect(result).toEqual({ id: 'gov_1' })
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
    expect(errorLog).not.toHaveBeenCalled()
  })
})

// The same guard-then-catch shape is repeated in every higher-level
// close-down; each one would file the same false incident.
describe.each([
  {
    resolver: 'CloseDownGovernorship',
    args: { governorshipId: 'gov_1' },
    check: { name: 'Test', bacentaCount: int(2) },
    empty: { name: 'Test', bacentaCount: int(0) },
    message: /^Test Governorship has 2 active bacentas/,
  },
  {
    resolver: 'CloseDownCouncil',
    args: { councilId: 'council_1' },
    check: { name: 'Test', governorshipCount: int(2) },
    empty: { name: 'Test', governorshipCount: int(0) },
    message: /^Test Council has 2 active governorships/,
  },
  {
    resolver: 'CloseDownStream',
    args: { streamId: 'stream_1' },
    check: { name: 'Test', councilCount: int(2), ministryCount: int(0) },
    empty: { name: 'Test', councilCount: int(0), ministryCount: int(0) },
    message: /^Test Stream has 2 active councils/,
  },
  {
    resolver: 'CloseDownStream',
    args: { streamId: 'stream_1' },
    check: { name: 'Test', councilCount: int(0), ministryCount: int(2) },
    empty: { name: 'Test', councilCount: int(0), ministryCount: int(0) },
    message: /^Test Stream has 2 active ministries/,
  },
  {
    resolver: 'CloseDownCampus',
    args: { campusId: 'campus_1' },
    check: { name: 'Test', streamCount: int(2) },
    empty: { name: 'Test', streamCount: int(0) },
    message: /^Test Campus has 2 active streams/,
  },
  {
    resolver: 'CloseDownOversight',
    args: { oversightId: 'oversight_1' },
    check: { name: 'Test', campusCount: int(2) },
    empty: { name: 'Test', campusCount: int(0) },
    message: /^Test Oversight has 2 active campuses/,
  },
])('SYN-232 — $resolver', ({ resolver, args, check, empty, message }) => {
  const run = () =>
    (
      directoryMutation as unknown as Record<
        string,
        (o: unknown, a: unknown, c: Context) => Promise<unknown>
      >
    )[resolver](null, args, context)

  it(`SYN-232: refuses active sub-churches (${message.source}) as BAD_USER_INPUT without logging an error`, async () => {
    queueReads(check)

    await expectUserError(run(), message)

    expect(errorLog).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-232: refuses unbanked offering as BAD_USER_INPUT without logging an error', async () => {
    queueReads(empty, unbankedService)

    await expectUserError(run(), /^Please bank outstanding offering/)

    expect(errorLog).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })
})
