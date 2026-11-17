/**
 * SYN-233 — CloseDownBacenta precondition errors.
 *
 * Closing a bacenta that still has active members (or unbanked offering) is a
 * precondition the user must fix. It used to be thrown as a plain Error and
 * then re-wrapped by throwToSentry, so Apollo reported it as
 * INTERNAL_SERVER_ERROR and every attempt paged the error intake. This file
 * pins:
 *
 *   - a non-empty bacenta rejects with BAD_USER_INPUT and the transfer hint,
 *     before any servant removal or write
 *   - an unbanked last service rejects with BAD_USER_INPUT, before any write
 *   - genuinely unexpected failures still go through throwToSentry
 *   - the happy path still writes via closeDownBacenta
 *
 * All test names begin with "SYN-233:" for grep-ability:
 *   npm test -- close-down-bacenta --testNamePattern="SYN-233:"
 */

import { GraphQLError } from 'graphql'
import { int } from 'neo4j-driver'
import directoryMutation from './directory-resolvers'
import * as closeChurchCypher from '../cypher/close-church-cypher'
import type { Context } from '../utils/neo4j-types'
import { RemoveServant } from './make-remove-servants'

jest.mock('../utils/assert-can', () => ({
  assertCan: jest.fn(),
}))

// Full mock (no requireActual): RemoveServant is exercised by its own tests,
// and loading the real module pulls in the servant Cypher this suite never runs.
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

const args = { bacentaId: 'bacenta_1', leaderId: 'leader_1' }

let readResults: Map<string, unknown>
let writeTx: { run: jest.Mock }
let mockSession: {
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context

beforeEach(() => {
  jest.clearAllMocks()

  readResults = new Map<string, unknown>([
    [
      closeChurchCypher.checkBacentaHasNoMembers,
      mockQueryResult({ name: 'Adenta', memberCount: 0 }),
    ],
    [
      closeChurchCypher.getLastServiceRecord,
      mockQueryResult({
        lastService: { properties: { bankingSlip: 'slip.png' } },
      }),
    ],
  ])
  writeTx = {
    run: jest
      .fn()
      .mockResolvedValue(mockQueryResult({ governorship: { id: 'gov_1' } })),
  }

  mockSession = {
    executeRead: jest.fn((work) =>
      work({ run: (query: string) => Promise.resolve(readResults.get(query)) })
    ),
    executeWrite: jest.fn((work) => work(writeTx)),
    close: jest.fn().mockResolvedValue(undefined),
  }
  context = {
    jwt: { userId: 'admin_1', roles: ['adminGovernorship'] },
    executionContext: { session: jest.fn().mockReturnValue(mockSession) },
  } as unknown as Context
})

describe('SYN-233 — CloseDownBacenta precondition errors', () => {
  it('SYN-233: rejects a bacenta with members as BAD_USER_INPUT before any write', async () => {
    readResults.set(
      closeChurchCypher.checkBacentaHasNoMembers,
      mockQueryResult({ name: 'Adenta', memberCount: 15 })
    )

    const error = await directoryMutation
      .CloseDownBacenta(null, args, context)
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(GraphQLError)
    expect((error as GraphQLError).extensions.code).toBe('BAD_USER_INPUT')
    expect((error as GraphQLError).message).toBe(
      'Adenta Bacenta has 15 members. Please transfer all members and try again.'
    )
    expect(RemoveServant).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
    expect(mockSession.close).toHaveBeenCalledTimes(2)
  })

  it('SYN-233: reads a neo4j Integer member count, not just a JS number', async () => {
    readResults.set(
      closeChurchCypher.checkBacentaHasNoMembers,
      mockQueryResult({ name: 'Adenta', memberCount: int(1) })
    )

    await expect(
      directoryMutation.CloseDownBacenta(null, args, context)
    ).rejects.toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } })
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-233: rejects an unbanked last service as BAD_USER_INPUT before any write', async () => {
    readResults.set(
      closeChurchCypher.getLastServiceRecord,
      mockQueryResult({
        lastService: {
          properties: { createdAt: '2026-11-12T10:00:00.000Z' },
        },
      })
    )

    const error = await directoryMutation
      .CloseDownBacenta(null, args, context)
      .catch((e: unknown) => e)

    expect((error as GraphQLError).extensions?.code).toBe('BAD_USER_INPUT')
    expect((error as GraphQLError).message).toMatch(
      /^Please bank outstanding offering/
    )
    expect(RemoveServant).not.toHaveBeenCalled()
    expect(mockSession.executeWrite).not.toHaveBeenCalled()
  })

  it('SYN-233: still routes unexpected failures through throwToSentry', async () => {
    writeTx.run.mockRejectedValueOnce(new Error('Neo4j unavailable'))

    const error = await directoryMutation
      .CloseDownBacenta(null, args, context)
      .catch((e: unknown) => e)

    expect(error).not.toBeInstanceOf(GraphQLError)
    expect((error as { extensions?: unknown }).extensions).toBeUndefined()
    expect((error as Error).message).toMatch(/^Error closing down bacenta: /)
  })

  it('SYN-233: an empty, banked bacenta still closes via closeDownBacenta', async () => {
    const result = await directoryMutation.CloseDownBacenta(
      null,
      args,
      context
    )

    expect(RemoveServant).toHaveBeenCalledTimes(1)
    expect(writeTx.run).toHaveBeenCalledWith(
      closeChurchCypher.closeDownBacenta,
      expect.objectContaining({ bacentaId: 'bacenta_1' })
    )
    expect(result).toEqual({ id: 'gov_1' })
  })
})
