/* eslint-disable react/destructuring-assignment */
import {
  errorHandling,
  isAuth,
  noEmptyArgsValidation,
  rearrangeCypherObject,
} from '../utils/utils'
import { ChurchLevel, Member, Role, ServantType } from '../utils/types'
import {
  sendServantPromotionEmail,
  sendServantRemovalEmail,
} from '../utils/notify'
import { Context } from '../utils/neo4j-types'
import { matchChurchQuery } from '../cypher/resolver-cypher'
import {
  churchInEmail,
  directoryLock,
  parseForCache,
  parseForCacheRemoval,
} from './helper-functions'
import { formatting, makeServantCypher, removeServantCypher } from './utils'

const texts = require('../texts.json')

/**
 * Composable validation - separates concerns into focused functions
 */
const validateAuthAndPermissions = (
  permittedRoles: Role[],
  userRoles: string[]
): void => {
  isAuth(permittedRoles, userRoles as Role[])
}

const validateDirectoryLock = (
  userRoles: string[],
  servantType: string
): void => {
  if (directoryLock(userRoles) && servantType !== 'arrivalsCounter') {
    throw new Error('Directory is locked till next Tuesday')
  }
}

const validateArguments = (
  churchLower: string,
  churchId: any,
  servantLower: string,
  servantId: any
): void => {
  noEmptyArgsValidation([
    `${churchLower}Id`,
    churchId,
    `${servantLower}Id`,
    servantId,
  ])
}

const validateServant = (servant: Member): boolean => {
  if (!servant.id) {
    return false
  }
  errorHandling(servant)
  return true
}

/**
 * Pre-flight checks: Authorization, locks, and argument validation
 * Composed from smaller, testable validation functions
 */
const validateMutation = (params: {
  permittedRoles: Role[]
  context: Context
  churchLower: string
  servantLower: string
  servantId: any
  churchId: any
}): void => {
  const {
    permittedRoles,
    context,
    churchLower,
    servantLower,
    servantId,
    churchId,
  } = params

  validateDirectoryLock(context.jwt.roles, servantLower)
  validateAuthAndPermissions(permittedRoles, context.jwt.roles)
  validateArguments(churchLower, churchId, servantLower, servantId)
}

/**
 * Query builder: Fetch church and servant data
 * Eliminates duplicated database calls pattern
 */
const fetchChurchAndServant = async (
  session: any,
  memberQuery: any,
  churchId: string,
  servantId: string
) => {
  const [churchRes, servantRes] = await Promise.all([
    session.run(matchChurchQuery, { id: churchId }),
    session.run(memberQuery, { id: servantId }),
  ])

  return {
    church: rearrangeCypherObject(churchRes),
    servant: rearrangeCypherObject(servantRes),
  }
}

/**
 * MakeServant: Promote a member to a leadership/admin role
 * DRY principle: Shared validation logic composed from smaller functions
 */
export const MakeServant = async (
  context: Context,
  args: any,
  permittedRoles: Role[],
  churchType: ChurchLevel,
  servantType: ServantType
) => {
  const { verb, servantLower, churchLower, memberQuery } = formatting(
    churchType,
    servantType
  )

  // Validate early and fail fast
  validateMutation({
    permittedRoles,
    context,
    churchLower,
    servantLower,
    churchId: args[`${churchLower}Id`],
    servantId: args[`${servantLower}Id`],
  })

  const session = context.executionContext.session()

  try {
    // Fetch primary entities
    const { church, servant } = await fetchChurchAndServant(
      session,
      memberQuery,
      args[`${churchLower}Id`],
      args[`${servantLower}Id`]
    )

    validateServant(servant)

    // Fetch old servant if being replaced
    const oldServant = args[`old${servantType}Id`]
      ? rearrangeCypherObject(
          await session.run(memberQuery, {
            id: args[`old${servantType}Id`],
          })
        )
      : undefined

    const churchNameInEmail = `${church.name} ${church.type}`

    // Execute promotion and notification in parallel
    await Promise.all([
      makeServantCypher({
        context,
        churchType,
        servantType,
        servant,
        args,
        church,
        oldServant,
      }),
      sendServantPromotionEmail(
        servant.email,
        servant.firstName,
        servant.lastName,
        churchType,
        servantType,
        churchNameInEmail,
        texts.html.helpdesk
      ),
    ])

    return parseForCache(servant, church, verb, servantLower)
  } finally {
    await session.close()
  }
}

/**
 * RemoveServant: Demote a member from a leadership/admin role
 * Same validation strategy as MakeServant
 */
export const RemoveServant = async (
  context: Context,
  args: any,
  permittedRoles: Role[],
  churchType: ChurchLevel,
  servantType: ServantType,
  removeOnly?: boolean
) => {
  const { verb, servantLower, churchLower, memberQuery } = formatting(
    churchType,
    servantType
  )

  validateMutation({
    permittedRoles,
    context,
    churchLower,
    servantLower,
    churchId: args[`${churchLower}Id`],
    servantId: args[`${servantLower}Id`],
  })

  const session = context.executionContext.session()

  try {
    // Fetch primary entities
    const { church, servant } = await fetchChurchAndServant(
      session,
      memberQuery,
      args[`${churchLower}Id`],
      args[`${servantLower}Id`]
    )

    // Fetch replacement servant if exists
    const newServant = args[`new${servantType}Id`]
      ? rearrangeCypherObject(
          await session.run(memberQuery, {
            id: args[`new${servantType}Id`],
          })
        )
      : undefined

    // Early exit if validation fails (except for special types)
    const specialRemovalTypes = ['ArrivalsCounter', 'Teller', 'ArrivalsPayer']
    if (
      (!validateServant(servant) || !validateServant(newServant ?? {})) &&
      !specialRemovalTypes.includes(servantType) &&
      !removeOnly
    ) {
      return null
    }

    // Execute removal and notification in parallel
    await Promise.all([
      removeServantCypher({
        context,
        churchType,
        servantType,
        servant,
        church,
      }),
      sendServantRemovalEmail(
        servant.email,
        servant.firstName,
        servant.lastName,
        churchType,
        servantType,
        churchInEmail(church)
      ),
    ])

    return parseForCacheRemoval(servant, church, verb, servantLower)
  } finally {
    await session.close()
  }
}
