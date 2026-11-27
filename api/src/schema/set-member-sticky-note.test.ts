/**
 * SYN-290: `SetMemberStickyNote` was an SDL `@cypher` write scoped with
 * `WHERE bacenta.id IN $jwt.allowedChurchIds`. When the caller was outside
 * the member's bacenta tree the MATCH found nothing and the field resolved
 * null — "Cannot return null for non-nullable field
 * Mutation.SetMemberStickyNote", coded INTERNAL_SERVER_ERROR.
 *
 * These tests run the FE's real `UpdateMemberStickyNote` document through the
 * schema the API serves (full SDL + root resolvers + `formatError`) with no
 * database, and pin that an out-of-scope save is a FORBIDDEN refusal that
 * never reaches `LogMemberHistory`.
 */
import { ApolloServer } from '@apollo/server'
import { Neo4jGraphQL } from '@neo4j/graphql'
import { typeDefs } from './graphql-schema'
import resolvers from '../resolvers/resolvers'
import { formatError } from '../resolvers/utils/error-reference'

// Same document as web-react-ts/src/pages/directory/update/UpdateMutations.ts.
const UPDATE_MEMBER_STICKY_NOTE = `
  mutation UpdateMemberStickyNote(
    $id: ID!
    $stickyNote: String!
    $ids: [ID]
    $historyRecord: String!
  ) {
    SetMemberStickyNote(memberId: $id, stickyNote: $stickyNote) {
      id
      stickyNote
    }
    LogMemberHistory(ids: $ids, historyRecord: $historyRecord) {
      id
    }
  }
`

const variables = {
  id: 'member_target_1',
  stickyNote: 'Call on Sunday',
  ids: ['member_target_1'],
  historyRecord: 'Added Sticky Note: Call on Sunday',
}

const jwt = {
  userId: 'user_admin_1',
  roles: ['adminCouncil'],
  allowedChurchIds: ['council_1'],
  servantTrees: [],
}

let server: ApolloServer

beforeAll(async () => {
  const schema = await new Neo4jGraphQL({ typeDefs, resolvers }).getSchema()
  server = new ApolloServer({ schema, formatError })
}, 60000)

// A driver-shaped stub: every query, whichever session method sends it, goes
// through one `run` so the test can see exactly which Cypher was sent.
// `inScope` drives the real assertScopeViaMember — its read returns the member
// row when the caller's servant edge covers the member's bacenta, else none.
const buildContext = (inScope: boolean) => {
  const run = jest.fn(async (cypher: string) => {
    // @neo4j/graphql's one-off `dbms.components` version probe.
    if (cypher.includes('dbms.components')) {
      return { records: [['5.26.0', 'enterprise']] }
    }
    if (cypher.includes('SET member.stickyNote')) {
      return {
        records: [
          {
            get: () => ({
              properties: {
                id: 'member_target_1',
                stickyNote: 'Call on Sunday',
              },
            }),
          },
        ],
      }
    }
    if (cypher.includes('RETURN member.id AS id')) {
      return { records: inScope ? [{ get: () => 'member_target_1' }] : [] }
    }
    // Anything @neo4j/graphql translates itself (LogMemberHistory).
    return { records: [], summary: { counters: { updates: () => ({}) } } }
  })
  const tx = { run }
  const session = {
    run,
    executeRead: (work: (t: typeof tx) => unknown) => work(tx),
    executeWrite: (work: (t: typeof tx) => unknown) => work(tx),
    close: jest.fn(),
  }
  const sent = (fragment: string) =>
    run.mock.calls.some(([cypher]) => String(cypher).includes(fragment))
  return {
    sent,
    contextValue: { jwt, executionContext: { session: () => session } },
  }
}

const execute = async (contextValue: unknown) => {
  const response = await server.executeOperation(
    { query: UPDATE_MEMBER_STICKY_NOTE, variables },
    { contextValue: contextValue as any }
  )
  if (response.body.kind !== 'single') throw new Error('expected single')
  return response.body.singleResult
}

describe('SYN-290 — UpdateMemberStickyNote through the served schema', () => {
  afterEach(() => jest.restoreAllMocks())

  it('SYN-290: an out-of-scope save is FORBIDDEN, not a null non-null field', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { sent, contextValue } = buildContext(false)

    const result = await execute(contextValue)

    expect(result.errors).toHaveLength(1)
    expect(result.errors?.[0].extensions?.code).toBe('FORBIDDEN')
    expect(result.errors?.[0].message).not.toContain('Cannot return null')
    expect(result.errors?.[0].path).toEqual(['SetMemberStickyNote'])
    expect(sent('RETURN member.id AS id')).toBe(true)
    // The non-null failure aborts the serial mutation, so no note is written
    // and no "Added Sticky Note" history entry is logged for it.
    expect(sent('SET member.stickyNote')).toBe(false)
    expect(sent('HistoryLog')).toBe(false)
  }, 30000)

  it('SYN-290: an in-scope save is served by the custom resolver', async () => {
    const { sent, contextValue } = buildContext(true)

    const result = await execute(contextValue)

    expect(result.errors).toBeUndefined()
    expect(sent('RETURN member.id AS id')).toBe(true)
    expect(sent('SET member.stickyNote')).toBe(true)
    expect(sent('HistoryLog')).toBe(true)
    expect((result.data as any)?.SetMemberStickyNote ?? null).toEqual({
      id: 'member_target_1',
      stickyNote: 'Call on Sunday',
    })
  }, 30000)
})
