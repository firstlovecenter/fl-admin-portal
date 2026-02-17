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
 * Each query gets its own independent session to avoid session reuse
 */
const fetchChurchAndServant = async (
  context: Context,
  memberQuery: any,
  churchId: string,
  servantId: string
) => {
  // Separate session for church query
  const churchSession = context.executionContext.session()
  const churchPromise = (async () => {
    try {
      const result = await churchSession.executeRead((tx) =>
        tx.run(matchChurchQuery, { id: churchId })
      )
      return rearrangeCypherObject(result)
    } finally {
      await churchSession.close()
    }
  })()

  // Separate session for servant query
  const servantSession = context.executionContext.session()
  const servantPromise = (async () => {
    try {
      const result = await servantSession.executeRead((tx) =>
        tx.run(memberQuery, { id: servantId })
      )
      return rearrangeCypherObject(result)
    } finally {
      await servantSession.close()
    }
  })()

  const [church, servant] = await Promise.all([churchPromise, servantPromise])

  return { church, servant }
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

  // Fetch primary entities with independent sessions
  const { church, servant } = await fetchChurchAndServant(
    context,
    memberQuery,
    args[`${churchLower}Id`],
    args[`${servantLower}Id`]
  )

  validateServant(servant)

  // Fetch old servant if being replaced (independent session per query)
  let oldServant: Member | undefined
  if (args[`old${servantType}Id`]) {
    const oldServantSession = context.executionContext.session()
    try {
      const oldServantRes = await oldServantSession.executeRead((tx) =>
        tx.run(memberQuery, { id: args[`old${servantType}Id`] })
      )
      oldServant = rearrangeCypherObject(oldServantRes)
    } finally {
      await oldServantSession.close()
    }
  }

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

  // Fetch primary entities with independent session
  const { church, servant } = await fetchChurchAndServant(
    context,
    memberQuery,
    args[`${churchLower}Id`],
    args[`${servantLower}Id`]
  )

  // Fetch replacement servant if exists (independent session)
  let newServant: Member | undefined
  if (args[`new${servantType}Id`]) {
    const newServantSession = context.executionContext.session()
    try {
      const newServantRes = await newServantSession.executeRead((tx) =>
        tx.run(memberQuery, { id: args[`new${servantType}Id`] })
      )
      newServant = rearrangeCypherObject(newServantRes)
    } finally {
      await newServantSession.close()
    }
  }

  // Early exit if validation fails (except for special types)
  const specialRemovalTypes = ['ArrivalsCounter', 'Teller', 'ArrivalsPayer']
  if (
    (!validateServant(servant) || !validateServant(newServant ?? {})) &&
    !specialRemovalTypes.includes(servantType) &&
    !removeOnly
  ) {
    return null
  }

  // Execute removal operations in parallel, skipping if no valid servant
  const operations: Promise<any>[] = []

  if (servant.id) {
    operations.push(
      removeServantCypher({
        context,
        churchType,
        servantType,
        servant,
        church,
      })
    )
  }

  if (servant.email) {
    operations.push(
      sendServantRemovalEmail(
        servant.email,
        servant.firstName,
        servant.lastName,
        churchType,
        servantType,
        churchInEmail(church)
      )
    )
  }

  if (operations.length > 0) {
    await Promise.all(operations)
  }

  return parseForCacheRemoval(servant, church, verb, servantLower)
}
