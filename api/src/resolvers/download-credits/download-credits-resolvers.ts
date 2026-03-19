import { permitMe } from '../permissions'
import { Context } from '../utils/neo4j-types'
import { ChurchLevel } from '../utils/types'
import { isAuth, throwToSentry } from '../utils/utils'
import {
  fellowshipDownloadMembers,
  bacentaDownloadMembers,
  governorshipDownloadMembers,
  councilDownloadMembers,
  streamDownloadMembers,
  campusDownloadMembers,
  oversightDownloadMembers,
} from './download-credits-member-cypher'

const createDownloadMembershipResolver = (
  cypherQuery: string,
  permissionLevel: ChurchLevel
) => {
  return async (
    object: { id: string },
    args: unknown,
    context: Context
  ) => {
    const session = context.executionContext.session()
    isAuth(permitMe(permissionLevel), context.jwt.roles)

    try {
      const result = await session.executeRead((tx) => {
        return tx.run(cypherQuery, { id: object.id })
      })

      return result.records[0]?.get('members') ?? []
    } catch (error) {
      throwToSentry(
        `Error getting ${permissionLevel} membership`,
        error
      )
    } finally {
      await session.close()
    }

    return []
  }
}

export const downloadMembershipResolvers = {
  Fellowship: {
    downloadMembership: createDownloadMembershipResolver(
      fellowshipDownloadMembers,
      'Fellowship'
    ),
  },
  Bacenta: {
    downloadMembership: createDownloadMembershipResolver(
      bacentaDownloadMembers,
      'Bacenta'
    ),
  },
  Governorship: {
    downloadMembership: createDownloadMembershipResolver(
      governorshipDownloadMembers,
      'Governorship'
    ),
  },
  Council: {
    downloadMembership: createDownloadMembershipResolver(
      councilDownloadMembers,
      'Council'
    ),
  },
  Stream: {
    downloadMembership: createDownloadMembershipResolver(
      streamDownloadMembers,
      'Stream'
    ),
  },
  Campus: {
    downloadMembership: createDownloadMembershipResolver(
      campusDownloadMembers,
      'Campus'
    ),
  },
  Oversight: {
    downloadMembership: createDownloadMembershipResolver(
      oversightDownloadMembers,
      'Oversight'
    ),
  },
}
