/* eslint-disable no-console */
import axios from 'axios'
import { throwToSentry } from '../utils/utils'
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
import { deleteUserRoles, setUserRoles } from '../utils/auth0'
import { getAuth0Roles } from '../authenticate'

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
  const authRoles = await getAuth0Roles(authToken)
  const userRoleIds = userRoles.map((role) => authRoles[role].id)

  // A remove roles function to simplify removing roles with an axios request
  if (userRoleIds.includes(rolesToRemove)) {
    const deleteRoleConfig = await deleteUserRoles(
      servant.auth_id,
      [rolesToRemove],
      authToken
    )
    return axios(deleteRoleConfig)
      .then(() =>
        console.log(
          `Role successfully removed for ${servant.firstName} ${servant.lastName}`
        )
      )
      .catch((err: any) =>
        throwToSentry('There was an error removing role', err)
      )
  }
  return servant
}

export const assignRoles = async (
  servant: Member,
  userRoles: Role[],
  rolesToAssign: Role[],
  authToken: string
) => {
  const authRoles = await getAuth0Roles(authToken)
  const userRoleIds = userRoles.map((role) => authRoles[role].id)
  const authRolesArray: [string, unknown][] = Object.entries(authRoles)

  const nameOfRoles = authRolesArray
    .map((role: any) => {
      if (rolesToAssign[0] === role[1].id) {
        return role[1].name
      }
      return ''
    })
    .filter((role: string) => role)

  if (userRoleIds.includes(rolesToAssign[0])) {
    console.log(
      `${servant.firstName} ${servant.lastName} already has the role`,
      nameOfRoles[0]
    )
    return
  }

  // An assign roles function to simplify assigning roles with an axios request
  if (!userRoleIds.includes(rolesToAssign[0])) {
    try {
      const setRoleConfig = await setUserRoles(
        servant.auth_id,
        rolesToAssign,
        authToken
      )
      await axios(setRoleConfig)

      console.log(
        nameOfRoles[0],
        `role successfully added to ${servant.firstName} ${servant.lastName}`
      )
    } catch (err: any) {
      throwToSentry('There was an error assigning role', err)
    }
  }
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
export const servantInEmail = (servant: Member) => {
  return servant
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
