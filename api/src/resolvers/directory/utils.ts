import {
  nextHigherChurch,
  rearrangeCypherObject,
  throwErrorMsg,
} from '../utils/utils'
import {
  ChurchLevel,
  MemberWithoutBioData,
  ServantType,
  ServantTypeLowerCase,
} from '../utils/types'
import { Context } from '../utils/neo4j-types'
import { HistoryRecordArgs, historyRecordString } from './helper-functions'
import CreateChurchHistorySubstructure from './history-substructure'
import servantCypher from './servant-cypher'
import {
  matchMemberQuery,
  matchMemberTellerQuery,
} from '../cypher/resolver-cypher'

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

  if (servantType === 'ArrivalsConfirmer') {
    verb = `isArrivalsConfirmerFor${churchType}`
    servantLower = 'arrivalsConfirmer'
  }
  if (servantType === 'Teller') {
    verb = `isTellerFor${churchType}`
    servantLower = 'teller'
    memberQuery = matchMemberTellerQuery
  }

  if (churchType === 'GatheringService') {
    churchLower = 'gatheringService'
  }

  return {
    verb,
    servantLower,
    churchLower,
    memberQuery,
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

  if (!servant.id) {
    throwErrorMsg('There is no servant to remove')
  }

  // Disconnect him from the Church
  await session.run(servantCypher[`disconnectChurch${servantType}`], {
    [`${servantLower}Id`]: servant.id ?? '',
    churchId: church.id,
    auth_id: servant.auth_id,
    auth: context.auth,
  })

  const historyRecordStringArgs = {
    servant,
    church,
    churchType,
    servantType,
    removed: true,
  }

  const historyLogRes = rearrangeCypherObject(
    await session.run(servantCypher.createHistoryLog, {
      id: servant.id,
      churchType,
      historyRecord: historyRecordString(historyRecordStringArgs),
    })
  )

  await session.run(servantCypher.connectHistoryLog, {
    churchId: church.id,
    servantId: servant.id,
    logId: historyLogRes.id,
    auth: context.auth,
  })
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
  const { servantLower } = terms

  const session = context.executionContext.session()
  // Connect Leader to Church

  const connectedChurchRes = rearrangeCypherObject(
    await session
      .run(servantCypher[`connectChurch${servantType}`], {
        [`${servantLower}Id`]: servant.id,
        churchId: church.id,
        auth_id: servant.auth_id,
        auth: context.auth,
      })
      .catch((e: any) =>
        throwErrorMsg(`Error Connecting Church${servantType}`, e)
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
      .catch((e: any) => throwErrorMsg(`Error Creating History Log`, e))
  )
  if (servantType === 'Leader') {
    await session
      .run(servantCypher.makeHistoryServiceLog, {
        logId: serviceLogRes.id,
      })
      .catch((e: any) =>
        throwErrorMsg(`Error Converting History to Service Log`, e)
      )
    await session
      .run(servantCypher.connectServiceLog, {
        churchId: church.id,
        servantId: servant.id,
        oldServantId: oldServant?.id ?? '',
        logId: serviceLogRes.id,
        auth: context.auth,
      })
      .catch((e: any) => throwErrorMsg(`Error Connecting Service Log`, e))
  } else {
    await session
      .run(servantCypher.connectHistoryLog, {
        churchId: church.id,
        servantId: servant.id,
        oldServantId: oldServant?.id ?? '',
        logId: serviceLogRes.id,
        auth: context.auth,
      })
      .catch((e: any) => throwErrorMsg(`Error Connecting History Log`, e))
  }

  await CreateChurchHistorySubstructure({
    churchType,
    servantType,
    church,
    session,
  })
}
