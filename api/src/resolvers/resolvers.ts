import { GraphQLError } from 'graphql'
import serviceNoIncomeMutations from './no-income/service-resolvers'
import serviceMutation from './services/service-resolvers'
import { Member } from './utils/types'
import treasuryMutations from './manual-banking/treasury-resolvers'
import directoryMutation from './directory/directory-resolvers'
import {
  arrivalsMutation,
  arrivalsResolvers,
} from './arrivals/arrivals-resolvers'
import bankingMutation from './banking/banking-resolver'
import { accountsMutations } from './accounts/accounts-resolvers'
import { mapsResolvers } from './maps/maps-resolvers'
import { Context } from './utils/neo4j-types'
import MakeServantResolvers from './directory/make-servant-resolvers'
import { reportsResolvers } from './reports/reports-resolvers'
import shepherdingControlResolvers from './shepherding-control/shepherding-control-resolvers'
import uploadMutations from './uploads/upload-resolvers'
import assistantResolvers from './assistant/assistant-resolvers'

const dotenv = require('dotenv')

dotenv.config()

type StreamParent = {
  id?: string
  meetingDay?: {
    day: string
    dayNumber: number
  }
  campus?: {
    id: string
    name?: string
    streams?: Array<{
      id: string
      name: string
    }>
  }
}

type CampusParent = {
  id?: string
  streams?: Array<{
    id: string
    name: string
  }>
}

const loadStreamMeetingDay = async (
  source: StreamParent,
  args: unknown,
  context: Context
) => {
  if (source.meetingDay) {
    return source.meetingDay
  }

  if (!source.id) {
    return null
  }

  const session = context.executionContext.session()

  try {
    const result = await session.executeRead((tx) =>
      tx.run(
        `
        MATCH (:Stream {id: $id})-[:MEETS_ON]->(meetingDay:ServiceDay)
        RETURN meetingDay {.day, .dayNumber} AS meetingDay
        `,
        { id: source.id }
      )
    )

    return result.records[0]?.get('meetingDay') ?? null
  } finally {
    await session.close()
  }
}

const loadStreamCampus = async (
  source: StreamParent,
  args: unknown,
  context: Context
) => {
  if (source.campus) {
    return source.campus
  }

  if (!source.id) {
    return null
  }

  const session = context.executionContext.session()

  try {
    const result = await session.executeRead((tx) =>
      tx.run(
        `
        MATCH (campus:Campus)-[:HAS]->(:Stream {id: $id})
        RETURN campus {.id, .name} AS campus
        `,
        { id: source.id }
      )
    )

    return result.records[0]?.get('campus') ?? null
  } finally {
    await session.close()
  }
}

const loadCampusStreams = async (
  source: CampusParent,
  args: unknown,
  context: Context
) => {
  if (source.streams) {
    return source.streams
  }

  if (!source.id) {
    return []
  }

  const session = context.executionContext.session()

  try {
    const result = await session.executeRead((tx) =>
      tx.run(
        `
        MATCH (:Campus {id: $id})-[:HAS]->(stream:Stream)
        RETURN stream {.id, .name} AS stream
        ORDER BY stream.name
        `,
        { id: source.id }
      )
    )

    return result.records.map((record) => record.get('stream'))
  } finally {
    await session.close()
  }
}

const resolvers = {
  // Resolver Parameters
  // Object: the parent result of a previous resolver
  // Args: Field Arguments
  // Context: Context object, database connection, API, etc
  // GraphQLResolveInfo

  Query: {
    ...shepherdingControlResolvers.Query,
    ...assistantResolvers.Query,
    // Returns the per-edge authority that `index.js` already computed and
    // attached to `context.jwt`. No Cypher executes here — the cache
    // round-trip happened at request-context construction. The FE calls
    // this exactly once on login to populate `currentUser.authority`,
    // which then drives `useCan` / `useCanViewChurch` everywhere else.
    //
    // Defensive: schema-level `@authentication` should reject unauthenticated
    // callers before this resolver runs, but the context builder coerces a
    // verifier-rejected token to `{}` (no userId), so the explicit guard
    // here makes the resolver independently safe and surfaces a clear
    // FORBIDDEN rather than an empty payload.
    myAuthority: (_: unknown, __: unknown, context: Context) => {
      if (!context?.jwt?.userId) {
        throw new GraphQLError('You must be authenticated.', {
          extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' },
        })
      }
      return {
        servantTrees: context.jwt.servantTrees ?? [],
        allowedChurchIds: context.jwt.allowedChurchIds ?? [],
      }
    },
  },

  Member: {
    fullName: (source: Member) => `${source.firstName} ${source.lastName}`,
    nameWithTitle: async (source: Member, args: unknown, context: Context) => {
      const session = context.executionContext.session()

      const res = await session.run(
        `MATCH (member:Member {id: $id})-[:HAS_GENDER]->(gender:Gender)
          MATCH (member)-[:HAS_TITLE]->(title:Title)
          RETURN member AS member, gender.gender AS gender, title.name AS title, title.priority AS priority ORDER BY priority DESC LIMIT 1`,
        {
          id: source.id,
        }
      )

      const gender = res.records[0]?.get('gender')
      const title = res.records[0]?.get('title') ?? ''
      let shortTitle = ''

      if (title === 'Bishop') {
        shortTitle = 'Bishop'
      }
      if (title === 'Bishop' && gender === 'Female') {
        shortTitle = 'Mother'
      }

      if (title === 'Reverend') {
        shortTitle = 'Rev.'
      }
      if (title === 'Reverend' && gender === 'Female') {
        shortTitle = 'LR'
      }
      if (title === 'Pastor') {
        shortTitle = 'Ps.'
      }
      if (title === 'Pastor' && gender === 'Female') {
        shortTitle = 'LP'
      }

      return `${shortTitle} ${source.firstName} ${source.lastName}`
    },
    ...mapsResolvers.Member,
  },

  Bacenta: {
    ...reportsResolvers.Bacenta,
  },
  Governorship: {
    ...reportsResolvers.Governorship,
  },
  Council: {
    ...reportsResolvers.Council,
  },
  Campus: {
    ...reportsResolvers.Campus,
    streams: loadCampusStreams,
  },
  Stream: {
    meetingDay: loadStreamMeetingDay,
    campus: loadStreamCampus,
    ...arrivalsResolvers.Stream,
    ...reportsResolvers.Stream,
  },
  Oversight: {
    ...reportsResolvers.Oversight,
  },

  Mutation: {
    ...MakeServantResolvers,
    ...directoryMutation,
    ...arrivalsMutation,
    ...serviceMutation,
    ...bankingMutation,
    ...treasuryMutations,
    ...serviceNoIncomeMutations,
    ...accountsMutations,
    ...uploadMutations,
    ...assistantResolvers.Mutation,
  },
}

export default resolvers
