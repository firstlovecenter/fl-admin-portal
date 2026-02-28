import {
  nextHigherChurch,
  rearrangeCypherObject,
  throwToSentry,
} from '../utils/utils'
import {
  ChurchLevel,
  MemberWithoutBioData,
  ServantType,
  ServantTypeLowerCase,
} from '../utils/types'
import { Context } from '../utils/neo4j-types'
import { HistoryRecordArgs, historyRecordString } from './helper-functions'
import servantCypher from './servant-cypher'
import {
  matchMemberDenominationQuery,
  matchMemberOversightQuery,
  matchMemberQuery,
  matchMemberTellerQuery,
} from '../cypher/resolver-cypher'
import {
  matchMemberCreativeArtsQuery,
  matchMemberHubCouncilQuery,
  matchMemberHubQuery,
  matchMemberMinistryQuery,
} from '../cypher/ministry-directory-cypher'

export const setPriorityLevel = (churchType: ChurchLevel) => {
  let priority = 0
  switch (churchType) {
    case 'Denomination':
      priority = 1
      break
    case 'Oversight':
      priority = 2
      break
    case 'Campus':
      priority = 3
      break
    case 'Stream':
    case 'CreativeArts':
      priority = 4
      break
    case 'Council':
    case 'Ministry':
      priority = 5
      break
    case 'HubCouncil':
    case 'Governorship':
      priority = 6
      break
    case 'Hub':
    case 'Bacenta':
      priority = 7
      break
    case 'Fellowship':
      priority = 8
      break
    default:
      priority = 0
  }

  return priority
}

export const formatting = (
  churchType: ChurchLevel,
  servantType: ServantType
) => {
  let churchLower = churchType?.toLowerCase()
  let servantLower: ServantTypeLowerCase = 'leader'
  let memberQuery = matchMemberQuery

  let verb = `leads${churchType}`
  if (servantType === 'Admin') {
    verb = `isAdminFor${churchType}`
    servantLower = 'admin'
  }
  if (servantType === 'ArrivalsAdmin') {
    verb = `isArrivalsAdminFor${churchType}`
    servantLower = 'arrivalsAdmin'
  }
  if (servantType === 'ArrivalsCounter') {
    verb = `isArrivalsCounterFor${churchType}`
    servantLower = 'arrivalsCounter'
  }

  if (servantType === 'ArrivalsPayer') {
    verb = `isArrivalsPayerFor${churchType}`
    servantLower = 'arrivalsPayer'
  }
  if (servantType === 'Teller') {
    verb = `isTellerFor${churchType}`
    servantLower = 'teller'
    memberQuery = matchMemberTellerQuery
  }

  if (churchType === 'Campus') {
    churchLower = 'campus'
  }
  if (churchType === 'Oversight') {
    memberQuery = matchMemberOversightQuery
  }
  if (churchType === 'Denomination') {
    memberQuery = matchMemberDenominationQuery
  }

  if (churchType === 'CreativeArts') {
    churchLower = 'creativeArts'
    memberQuery = matchMemberCreativeArtsQuery
  }
  if (churchType === 'Ministry') {
    churchLower = 'ministry'
    memberQuery = matchMemberMinistryQuery
  }
  if (churchType === 'HubCouncil') {
    churchLower = 'hubCouncil'
    memberQuery = matchMemberHubCouncilQuery
  }
  if (churchType === 'Hub') {
    churchLower = 'hub'
    memberQuery = matchMemberHubQuery
  }

  const priority = setPriorityLevel(churchType)

  return {
    verb,
    servantLower,
    churchLower,
    memberQuery,
    priority,
  }
}

type MakeRemoveServantArgs = {
  context: Context
  churchType: ChurchLevel
  servantType: ServantType
  servant: MemberWithoutBioData
  church: { id: string; name: string }
  args?: { leaderId: string }
  oldServant?: MemberWithoutBioData
}

export const removeServantCypher = async ({
  context,
  churchType,
  servantType,
  servant,
  church,
}: MakeRemoveServantArgs) => {
  const terms = formatting(churchType, servantType)
  const { servantLower } = terms
  const session = context.executionContext.session()

  try {
    if (!servant.id) {
      // Skip servant removal if there's no servant to remove
      return
    }

    // Disconnect him from the Church
    await session.executeWrite((tx) =>
      tx.run(servantCypher[`disconnectChurch${servantType}`], {
        [`${servantLower}Id`]: servant.id ?? '',
        churchId: church.id,
        jwt: context.jwt,
      })
    )

    const historyRecordStringArgs = {
      servant,
      church,
      churchType,
      servantType,
      removed: true,
    }

    const historyLogRes = rearrangeCypherObject(
      await session.executeWrite((tx) =>
        tx.run(servantCypher.createHistoryLog, {
          id: servant.id,
          churchType,
          historyRecord: historyRecordString(historyRecordStringArgs),
        })
      )
    )

    await session.executeWrite((tx) =>
      tx.run(servantCypher.connectHistoryLog, {
        churchId: church.id,
        servantId: servant.id,
        logId: historyLogRes.id,
        jwt: context.jwt,
      })
    )
  } finally {
    await session.close()
  }
}

export const makeServantCypher = async ({
  context,
  churchType,
  servantType,
  servant,
  args,
  church,
  oldServant,
}: MakeRemoveServantArgs) => {
  const terms = formatting(churchType, servantType)
  const { servantLower, priority } = terms

  const session = context.executionContext.session()

  try {
    // Connect Leader to Church

    const connectedChurchRes = rearrangeCypherObject(
      await session
        .run(servantCypher[`connectChurch${servantType}`], {
          [`${servantLower}Id`]: servant.id,
          churchId: church.id,
          jwt: context.jwt,
        })
        .catch((e: any) =>
          throwToSentry(`Error Connecting Church${servantType}`, e)
        )
    )

    const historyRecordStringArgs: HistoryRecordArgs = {
      servant,
      servantType,
      oldServant,
      church,
      churchType,
      removed: false,
      args,
      higherChurch: {
        type: nextHigherChurch(churchType),
        name: connectedChurchRes?.higherChurchName,
      },
    }

    const serviceLogRes = rearrangeCypherObject(
      await session
        .run(servantCypher.createHistoryLog, {
          id: servant.id,
          churchType,
          historyRecord: historyRecordString(historyRecordStringArgs),
        })
        .catch((e: any) => throwToSentry(`Error Creating History Log`, e))
    )
    if (servantType === 'Leader') {
      await session
        .run(servantCypher.makeHistoryServiceLog, {
          logId: serviceLogRes.id,
          priority,
        })
        .catch((e: any) =>
          throwToSentry(`Error Converting History to Service Log`, e)
        )
      await session
        .run(servantCypher.connectServiceLog, {
          churchId: church.id,
          servantId: servant.id,
          oldServantId: oldServant?.id ?? '',
          logId: serviceLogRes.id,
          jwt: context.jwt,
        })
        .catch((e: any) => throwToSentry(`Error Connecting Service Log`, e))
    } else {
      await session
        .run(servantCypher.connectHistoryLog, {
          churchId: church.id,
          servantId: servant.id,
          oldServantId: oldServant?.id ?? '',
          logId: serviceLogRes.id,
          jwt: context.jwt,
        })
        .catch((e: any) => throwToSentry(`Error Connecting History Log`, e))
    }
  } finally {
    await session.close()
  }
}
