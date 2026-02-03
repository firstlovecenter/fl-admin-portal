/* eslint-disable no-console */
import {
  Church,
  ChurchIdAndName,
  ChurchLevel,
  ChurchLevelWithClosed,
  Member,
  MemberWithoutBioData,
  Role,
  ServantType,
  ServantTypeLowerCase,
} from '../utils/types'

export type HistoryRecordArgs = {
  servant: MemberWithoutBioData
  oldServant?: MemberWithoutBioData
  church: ChurchIdAndName
  churchType: ChurchLevel
  servantType: ServantType
  removed: boolean
  args?: { leaderId: string }
  higherChurch?: {
    name: string
    type: ChurchLevel
  }
}

export const directoryLock = (userRoles: string[]) => {
  if (
    (new Date().getDay() === 1 && new Date().getHours() >= 12) ||
    new Date().getDay() === 2 ||
    ['fishers']?.some((r) => userRoles.includes(r))
  ) {
    return false
  }

  return true
}

export const historyRecordString = ({
  servant,
  oldServant,
  church,
  churchType,
  servantType,
  removed,
  args,
  higherChurch,
}: HistoryRecordArgs) => {
  if (removed) {
    return `${servant.firstName} ${servant.lastName} was removed as the ${churchType} ${servantType} for  ${church.name} ${churchType}`
  }

  if (oldServant?.id) {
    return `${servant.firstName} ${servant.lastName} became the ${servantType} of ${church.name} ${churchType} replacing ${oldServant.firstName} ${oldServant.lastName}`
  }

  if (!args?.leaderId) {
    return `${servant.firstName} ${servant.lastName} became the ${servantType} of ${church.name} ${churchType}`
  }

  return `${servant.firstName} ${servant.lastName} started ${church.name} ${churchType} under ${higherChurch?.name} ${higherChurch?.type}`
}

export const removeRoles = async (
  servant: Member,
  userRoles: Role[],
  rolesToRemove: string,
  authToken: string
) => {
  // Auth0 role management has been removed
  // Roles are now managed directly in Neo4j database
  console.log(
    `Roles managed in Neo4j: ${servant.firstName} ${servant.lastName}`
  )
  return servant
}

export const assignRoles = async (
  servant: Member,
  userRoles: Role[],
  rolesToAssign: Role[],
  authToken: string
) => {
  // Auth0 role management has been removed
  // Roles are now managed directly in Neo4j database
  console.log(
    `Roles managed in Neo4j: ${servant.firstName} ${servant.lastName}`
  )
  return servant
}

export const churchInEmail = (church: {
  type: ChurchLevelWithClosed
  name: string
}) => {
  if (church.type === 'ClosedFellowship') {
    return `${church.name} Fellowship which has been closed`
  }

  if (church.type === 'ClosedBacenta') {
    return `${church.name} Bacenta which has been closed`
  }

  return `${church.name} ${church.type}`
}

export interface MemberWithKeys extends Member {
  [key: string]: any
}
interface ChurchWithKeys extends Church {
  [key: string]: any
}

export const parseForCache = (
  servant: MemberWithKeys,
  church: Church,
  verb: string,
  role: ServantTypeLowerCase
) => {
  // Returning the data such that it can update apollo cache
  servant[`${verb}`].push({
    id: church.id,
    name: church.name,
    momoNumber: null,
    [`${role}`]: {
      id: servant.id,
      firstName: servant.firstName,
      lastName: servant.lastName,
    },
  })

  servant[`${verb}`].forEach((churchMutable: ChurchWithKeys) => {
    // eslint-disable-next-line no-param-reassign
    churchMutable[`${role}`] = {
      id: servant.id,
      firstName: servant.firstName,
      lastName: servant.lastName,
    }
  })

  return servant
}

export const parseForCacheRemoval = (
  servant: MemberWithKeys,
  removedChurch: Church,
  verb: string,
  role: ServantTypeLowerCase
) => {
  const servantMutable = servant
  // Returning the data such that it can update apollo cache
  servantMutable[`${verb}`] = servantMutable[`${verb}`].filter(
    (church: Church) => {
      if (church.id === removedChurch.id) {
        return false
      }
      return true
    }
  )

  servant[`${verb}`].forEach((churchMutable: ChurchWithKeys) => {
    // eslint-disable-next-line no-param-reassign
    churchMutable[`${role}`] = {
      id: servant.id,
      firstName: servant.firstName,
      lastName: servant.lastName,
    }
  })

  return servantMutable
}
