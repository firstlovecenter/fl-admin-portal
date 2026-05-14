import { GraphQLError } from 'graphql'
import { permitLeaderAdmin } from '../permissions'
import { Context } from '../utils/neo4j-types'
import { isAuth, throwToSentry } from '../utils/utils'
import { getIsoWeek } from '../utils/iso-week'
import READ_WEEKLY_TIP_FOR_CHURCH_CYPHER from './assistant-cypher'

type WeeklyTipArgs = {
  churchId: string
}

const weeklyTipForChurch = async (
  _source: unknown,
  args: WeeklyTipArgs,
  context: Context
) => {
  isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)

  // Per-instance gate — the requested church must be in the caller's
  // allowedChurchIds list. Without this check a leader at one church could
  // read tips for a peer church by guessing its id.
  const allowed = context.jwt.allowedChurchIds ?? []
  if (!allowed.includes(args.churchId)) {
    throw new GraphQLError(
      'You are not permitted to view this church\'s weekly tip.',
      { extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' } }
    )
  }

  const now = new Date()
  const year = now.getFullYear()
  const week = getIsoWeek(now)

  const session = context.executionContext.session()
  try {
    const result = await session.executeRead((tx) =>
      tx.run(READ_WEEKLY_TIP_FOR_CHURCH_CYPHER, {
        churchId: args.churchId,
        year,
        week,
      })
    )
    return result.records[0]?.get('tip') ?? null
  } catch (error) {
    return throwToSentry('Error fetching weekly tip for church', error)
  } finally {
    await session.close()
  }
}

const assistantResolvers = {
  Query: {
    weeklyTipForChurch,
  },
}

export default assistantResolvers
