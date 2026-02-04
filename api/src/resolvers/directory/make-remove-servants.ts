/* eslint-disable react/destructuring-assignment */
import axios from 'axios'
import {
  errorHandling,
  isAuth,
  noEmptyArgsValidation,
  rearrangeCypherObject,
  throwToSentry,
} from '../utils/utils'
import { ChurchLevel, Member, Role, ServantType } from '../utils/types'
import { sendSingleEmail } from '../utils/notify'
import { Context } from '../utils/neo4j-types'
import {
  changePasswordConfig,
  createAuthUserConfig,
  deleteAuthUserConfig,
  getAuthIdConfig,
  updateAuthUserConfig,
import {
  matchChurchQuery,
  removeMemberAuthId,
  getChurchDataQuery,
} from '../cypher/resolver-cypher'
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
  const authToken = await getAuthToken()
//   const authRoles = await getAuth0Roles(authToken)
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

  // Check for AuthID of servant
  const authIdConfig = await getAuthIdConfig(servant, authToken)
  const authIdResponse = await axios(authIdConfig)

  servant.auth_id = authIdResponse.data[0]?.user_id

  if (!servant.auth_id) {
    try {
//       // If servant Does Not Have Auth0 Profile, Create One
      const createUserCfg = await createAuthUserConfig(servant, authToken)
      const authProfileResponse = await axios(createUserCfg)

      const passwordTicketConfig = await changePasswordConfig(
        servant,
        authToken
      )
      const passwordTicketResponse = await axios(passwordTicketConfig)

      servant.auth_id = authProfileResponse.data.user_id
      const roles: Role[] = []

      await Promise.all([
        // Send Mail to the Person after Password Change Ticket has been generated
        sendSingleEmail(
          servant,
          'Your Account Has Been Created On The FL State of the Flock Admin Portal',
          undefined,
          `<p>Hi ${servant.firstName} ${servant.lastName},<br/><br/>Congratulations on being made the <b>${churchType} ${servantType}</b> for <b>${churchNameInEmail}</b>.<br/><br/>Your account has just been created on the First Love Church Administrative Portal. Please set up your password by clicking <b><a href=${passwordTicketResponse.data.ticket}>this link</a></b>. After setting up your password, you can log in by clicking <b>https://synago.firstlovecenter.com/</b><br/><br/>Please go through ${texts.html.helpdesk} to find guidelines and instructions on how to use it as well as answers to questions you may have.</p>${texts.html.subscription}`
        ),
        assignRoles(
          servant,
          roles,
          [authRoles[`${servantLower}${churchType}`].id],
          authToken
        ),
//         // Write Auth0 ID of Leader to Neo4j DB
        makeServantCypher({
          context,
          churchType,
          servantType,
          servant,
          args,
          church,
          oldServant,
        }),
      ]).then(() =>
        console.log(
//           `Auth0 Account successfully created for ${servant.firstName} ${servant.lastName}`
        )
      )
    } catch (error: any) {
      throwToSentry('Servant had no authId and hit an error', error)
    }
  } else if (servant.auth_id) {
    // Update a user's Auth Profile with Picture and Name Details
    const updateUserConfig = await updateAuthUserConfig(servant, authToken)
    await axios(updateUserConfig)


    const userRoleResponse = await axios(userRoleConfig)
    const roles = userRoleResponse.data.map(
      (role: { name: string }) => role.name
    )

//     // Write Auth0 ID of Servant to Neo4j DB

    await Promise.all([
      assignRoles(
        servant,
        roles,
        [authRoles[`${servantLower}${churchType}`].id],
        authToken
      ),
      makeServantCypher({
        context,
        args,
        churchType,
        servantType,
        servant,
        oldServant,
        church,
      }),
      sendSingleEmail(
        servant,
        'FL Servanthood Status Update',
        undefined,
        `<p>Hi ${servant.firstName} ${servant.lastName},<br/><br/>Congratulations on your new position as the <b>${churchType} ${servantType}</b> for <b>${churchNameInEmail}</b>.<br/><br/>Once again we are reminding you to go through ${texts.html.helpdesk} to find guidelines and instructions as well as answers to questions you may have</p>${texts.html.subscription}`
      ),
    ])
  }

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
  const authToken: string = await getAuthToken()
//   const authRoles = await getAuth0Roles(authToken)
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

  if (!servant.auth_id) {
    // if he has no auth_id then there is nothing to do
    await removeServantCypher({
      context,
      churchType,
      servantType,
      servant,
      church,
    })
    return parseForCache(servant, church, verb, servantLower)
  }

  if (servant[`${verb}`].length > 1) {
//     // If he leads more than one Church don't touch his Auth0 roles
    console.log(
      `${servant.firstName} ${servant.lastName} leads more than one ${churchType}`
    )
    await Promise.all([
      // Disconnect him from the Church
      removeServantCypher({
        context,
        churchType,
        servantType,
        servant,
        church,
      }),
      // Send a Mail to That Effect
      sendSingleEmail(
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
      ),
    ])

    await session.close()
    return parseForCacheRemoval(servant, church, verb, servantLower)
  }

  const userRoleResponse = await axios(userRoleConfig)
  const roles: Role[] = userRoleResponse.data.map(
  )
  const rolesToCompare: string[] = roles
  if (
    rolesToCompare.includes(`${servantLower}${churchType}`) &&
    roles.length === 1
  ) {
    const deleteUserConfig = await deleteAuthUserConfig(
      servant.auth_id,
      authToken
    )
    await axios(deleteUserConfig)

    console.log(
//       `Auth0 Account successfully deleted for ${servant.firstName} ${servant.lastName}`
    )
//     // Remove Auth0 ID of Leader from Neo4j DB
    removeServantCypher({
      context,
      churchType,
      servantType,
      servant,
      church,
    })

    const { jwt } = context

    await session.executeWrite((tx) =>
      tx.run(removeMemberAuthId, {
        log: `${servant.firstName} ${servant.lastName} was removed as a ${churchType} ${servantType}`,
        auth_id: servant.auth_id,
        jwt,
      })
    )

    // Send a Mail to That Effect
    sendSingleEmail(
      servant,
      'Your Servant Account Has Been Deleted',
      undefined,
      `Hi ${servant.firstName} ${
        servant.lastName
      },<br/><br/>This is to inform you that your servant account has been deleted from the First Love State of the Flock Admin Portal. You will no longer have access to any data<br/><br/>his is due to the fact that you have been removed as a ${churchType} ${servantType} for ${churchInEmail(
        church
      )}.<br/><br/>We however encourage you to strive to serve the Lord faithfully. Do not be discouraged from loving God by this removal; we hope it is just temporary.${
        texts.html.subscription
      }`
    )

    await session.close()
    return parseForCacheRemoval(servant, church, verb, servantLower)
  }

  // If the person is a bacenta leader as well as any other position, remove role bacenta leader
  if (
    rolesToCompare.includes(`${servantLower}${churchType}`) &&
    roles.length > 1
  ) {
    removeServantCypher({
      context,
      churchType,
      servantType,
      servant,
      church,
    })
    removeRoles(
      servant,
      roles,
      authRoles[`${servantLower}${churchType}`].id,
      authToken
    )
    // Send Email Using Mailgun
    sendSingleEmail(
      servant,
      'You Have Been Removed!',
      undefined,
      `<p>Hi ${servant.firstName} ${
        servant.lastName
      },<br/><br/>We regret to inform you that you have been removed as the <b>${churchType} ${servantType}</b> for <b>${churchInEmail(
        church
      )}</b>.<br/><br/>We however encourage you to strive to serve the Lord faithfully in your other roles. Do not be discouraged by this removal; as you work hard we hope and pray that you will soon be restored to your service to him.</p>${
        texts.html.subscription
      }`
    )
  }

  await session.close()
  return parseForCacheRemoval(servant, church, verb, servantLower)
}
