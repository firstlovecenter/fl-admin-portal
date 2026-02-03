/* eslint-disable react/destructuring-assignment */
import {
  errorHandling,
  isAuth,
  noEmptyArgsValidation,
  rearrangeCypherObject,
} from '../utils/utils'
import { ChurchLevel, Member, Role, ServantType } from '../utils/types'
import { sendSingleEmail } from '../utils/notify'
import { Context } from '../utils/neo4j-types'
import {
  churchInEmail,
  directoryLock,
  MemberWithKeys,
  parseForCache,
  parseForCacheRemoval,
} from './helper-functions'
import { formatting, makeServantCypher, removeServantCypher } from './utils'
import { matchChurchQuery, getChurchDataQuery } from '../cypher/resolver-cypher'
import texts from '../texts.json'

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

  // Update servant in database
  await makeServantCypher({
    context,
    churchType,
    servantType,
    servant,
    args,
    church,
    oldServant,
  })

  // Send notification email
  await sendSingleEmail(
    servant,
    'FL Servanthood Status Update',
    undefined,
    `<p>Hi ${servant.firstName} ${servant.lastName},<br/><br/>Congratulations on your new position as the <b>${churchType} ${servantType}</b> for <b>${churchNameInEmail}</b>.<br/><br/>You can log in to the First Love Church Administrative Portal at <b>https://synago.firstlovecenter.com/</b><br/><br/>Please go through ${texts.html.helpdesk} to find guidelines and instructions as well as answers to questions you may have</p>${texts.html.subscription}`
  )

  console.log(
    `${servant.firstName} ${servant.lastName} made ${churchType} ${servantType}`
  )

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
    !['ArrivalsCounter', 'Teller', 'SheepSeeker', 'ArrivalsPayer'].includes(
      servantType
    ) &&
    !removeOnly
  ) {
    return null
  }

  // Remove servant from church
  await removeServantCypher({
    context,
    churchType,
    servantType,
    servant,
    church,
  })

  // Send notification email
  if (servant[`${verb}`] && servant[`${verb}`].length > 1) {
    // If they lead more than one church
    await sendSingleEmail(
      servant,
      'You Have Been Removed!',
      undefined,
      `<p>Hi ${servant.firstName} ${
        servant.lastName
      },<br/><br/>We regret to inform you that you have been removed as the <b>${churchType} ${servantType}</b> for <b>${churchInEmail(
        church
      )}</b>. Your church data for the last 8 weeks are as follows:
        <br/>
        Service attendance:<b>${churchDataRes.attendance}</b>, Average:<b>${
        churchDataRes.averageAttendance
      }</b>
        <br/>
        Income:<b>${churchDataRes.income}</b>, Average:<b>${
        churchDataRes.averageIncome
      }</b>
        <br/>
        Bussing:<b>${churchDataRes.bussingAttendance}</b>, Average:${
        churchDataRes.averageBussingAttendance
      }.
       <br/><br/>We however encourage you to strive to serve the Lord faithfully in your other roles. Do not be discouraged by this removal; as you work hard we hope and pray that you will soon be restored to your service to him.</p>${
         texts.html.subscription
       }`
    )
  } else {
    // If this was their only church
    await sendSingleEmail(
      servant,
      'You Have Been Removed!',
      undefined,
      `<p>Hi ${servant.firstName} ${
        servant.lastName
      },<br/><br/>We regret to inform you that you have been removed as the <b>${churchType} ${servantType}</b> for <b>${churchInEmail(
        church
      )}</b>.<br/><br/>We however encourage you to strive to serve the Lord faithfully. Do not be discouraged by this removal; as you work hard we hope and pray that you will soon be restored to your service to him.</p>${
        texts.html.subscription
      }`
    )
  }

  console.log(
    `${servant.firstName} ${servant.lastName} removed as ${churchType} ${servantType}`
  )

  await session.close()
  return parseForCacheRemoval(servant, church, verb, servantLower)
}
