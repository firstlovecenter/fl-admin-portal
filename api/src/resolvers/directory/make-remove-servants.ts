/* eslint-disable react/destructuring-assignment */
import {
  errorHandling,
  isAuth,
  noEmptyArgsValidation,
  rearrangeCypherObject,
  throwToSentry,
} from '../utils/utils'
import { ChurchLevel, Member, Role, ServantType } from '../utils/types'
import {
 
 ,

  sendServantPromotionEmail,
  sendServantRemovalEmail,
} from '../utils/notify'
import { Context } from '../utils/neo4j-types'
import { matchChurchQuery, getChurchDataQuery } from '../cypher/resolver-cypher'
import {
  assignRoles,
  churchInEmail,
  directoryLock,
  MemberWithKeys,
  parseForCache,
  parseForCacheRemoval,
  removeRoles,
} from './helper-functions'
import { formatting, makeServantCypher, removeServantCypher } from './utils'
import { getAuthToken } from '../authenticate'

const texts = require('../texts.json')

const setUp = (setUpArgs: {
  permittedRoles: Role[]
  context: Context
  churchLower: string
  servantLower: string
  args: any
}) => {
  const { permittedRoles, context, churchLower, servantLower, args } = setUpArgs

  if (
    directoryLock(context.jwt['https://flcadmin.netlify.app/roles']) &&
    servantLower !== 'arrivalsCounter'
  ) {
    throw new Error('Directory is locked till next Tuesday')
  }
  isAuth(permittedRoles, context.jwt['https://flcadmin.netlify.app/roles'])

  noEmptyArgsValidation([
    `${churchLower}Id`,
    args[`${churchLower}Id`],
    `${servantLower}Id`,
    args[`${servantLower}Id`],
  ])
}

const servantValidation = (servant: Member) => {
  if (!servant.id) {
    return false
  }
  errorHandling(servant)
  return true
}

export const MakeServant = async (
  context: Context,
  args: any,
  permittedRoles: Role[],
  churchType: ChurchLevel,
  servantType: ServantType
) => {
  // Auth0 integration removed - roles are now managed in Neo4j
  const terms = formatting(churchType, servantType)
  const { verb, servantLower, churchLower, memberQuery } = terms

  const setUpArgs = {
    permittedRoles,
    context,
    churchLower,
    servantLower,
    args,
  }

  setUp(setUpArgs)

  const session = context.executionContext.session()

  const churchRes = await session.run(matchChurchQuery, {
    id: args[`${churchLower}Id`],
  })

  const church = rearrangeCypherObject(churchRes)
  const churchNameInEmail = `${church.name} ${church.type}`

  const servantRes = await session.run(memberQuery, {
    id: args[`${servantLower}Id`],
  })

  const oldServantRes = await session.run(memberQuery, {
    id: args[`old${servantType}Id`] ?? '',
  })

  const servant = rearrangeCypherObject(servantRes)
  const oldServant = rearrangeCypherObject(oldServantRes)
  servantValidation(servant)

  // Auth0 integration removed - roles managed in Neo4j only
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

  await session.close()

  return parseForCache(servant, church, verb, servantLower)
}

export const RemoveServant = async (
  context: Context,
  args: any,
  permittedRoles: Role[],
  churchType: ChurchLevel,
  servantType: ServantType,
  removeOnly?: boolean
) => {
  // Auth0 integration removed - roles are now managed in Neo4j
  const terms = formatting(churchType, servantType)
  const { verb, servantLower, churchLower, memberQuery } = terms

  const setUpArgs = {
    permittedRoles,
    context,
    churchLower,
    servantLower,
    args,
  }
  setUp(setUpArgs)

  const session = context.executionContext.session()

  const churchRes = await session.run(matchChurchQuery, {
    id: args[`${churchLower}Id`],
  })

  const church = rearrangeCypherObject(churchRes)

  const servantRes = await session.run(memberQuery, {
    id: args[`${servantLower}Id`],
  })

  const newServantRes = await session.run(memberQuery, {
    id: args[`new${servantType}Id`] ?? '',
  })

  const servant: MemberWithKeys = rearrangeCypherObject(servantRes)
  const newServant: MemberWithKeys = rearrangeCypherObject(newServantRes)

  // fetch church data
  const churchDataRes = rearrangeCypherObject(
    await session.executeRead((tx) =>
      tx.run(getChurchDataQuery, {
        id: args[`${churchLower}Id`],
      })
    )
  )
  if (
    (!servantValidation(servant) || !servantValidation(newServant)) &&
    !['ArrivalsCounter', 'Teller', 'ArrivalsPayer'].includes(servantType) &&
    !removeOnly
  ) {
    return null
  }

  // Auth0 integration removed - all role management now in Neo4j
  await removeServantCypher({
    context,
    churchType,
    servantType,
    servant,
    church,
  })

  // Send removal notification
  await sendServantRemovalEmail(
    servant.email,
    servant.firstName,
    servant.lastName,
    churchType,
    servantType,
    churchInEmail(church)
  )

  await session.close()
  return parseForCacheRemoval(servant, church, verb, servantLower)
}
