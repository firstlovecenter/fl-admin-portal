import axios from 'axios'
import { getHumanReadableDate } from 'jd-date-utils'
import { Context } from '../utils/neo4j-types'
import { Member } from '../utils/types'
import { isAuth, rearrangeCypherObject, throwToSentry } from '../utils/utils'
import {
  permitSheepSeeker,
  permitAdmin,
  permitLeaderAdmin,
  permitAdminArrivals,
  permitLeader,
  permitMe,
} from '../permissions'
import { RemoveServant } from './make-remove-servants'

import {
  changePasswordConfig,
  createAuthUserConfig,
  getAuthIdConfig,
  updateAuthUserConfig,
} from '../utils/auth0'
import {
  makeMemberInactive,
  matchMemberQuery,
  updateMemberEmail,
  createMember,
  activateInactiveMember,
  removeDuplicateMember,
  matchMemberAndIMCLStatus,
  updateMemberAuthId,
  updateMemberBacenta,
} from '../cypher/resolver-cypher'
import { getAuthToken } from '../authenticate'
import { sendSingleEmail } from '../utils/notify'

const cypher = require('../cypher/resolver-cypher')
const texts = require('../texts.json')
const closeChurchCypher = require('../cypher/close-church-cypher')

const directoryMutation = {
  CreateMember: async (object: any, args: Member, context: Context) => {
    isAuth(
      [
        ...permitSheepSeeker(),
        ...permitLeaderAdmin('Fellowship'),
        ...permitLeader('Hub'),
      ],
      context?.auth.roles
    )

    const session = context.executionContext.session()

    const inactiveMemberResponse = rearrangeCypherObject(
      await session.executeRead((tx) =>
        tx.run(cypher.checkInactiveMember, {
          email: args.email ?? null,
          whatsappNumber: args?.whatsappNumber ?? null,
        })
      )
    )

    if (inactiveMemberResponse.count > 0) {
      const activateInactiveMemberResponse = await session.executeWrite((tx) =>
        tx.run(activateInactiveMember, {
          id: inactiveMemberResponse.id,
          firstName: args?.firstName ?? '',
          middleName: args?.middleName ?? '',
          lastName: args?.lastName ?? '',
          phoneNumber: args?.phoneNumber ?? '',
          dob: args?.dob ?? '',
          maritalStatus: args?.maritalStatus ?? '',
          occupation: args?.occupation ?? '',
          bacenta: args?.bacenta ?? '',
          basonta: args?.basonta ?? '',
          visitationArea: args?.visitationArea ?? '',
          pictureUrl: args?.pictureUrl ?? '',
          auth_id: context.auth.jwt.sub ?? '',
        })
      )

      const member = rearrangeCypherObject(activateInactiveMemberResponse)
      return member
    }

    const memberResponse = await session.executeRead((tx) =>
      tx.run(cypher.checkMemberEmailExists, {
        email: args.email ?? null,
        whatsappNumber: args?.whatsappNumber ?? null,
      })
    )
    const memberCheck = rearrangeCypherObject(memberResponse, true)[0]
    const duplicateMember = memberCheck.member?.properties

    if (memberCheck.predicate) {
      if (duplicateMember.email === args.email) {
        const errorMsg = `There is a member with this email "${duplicateMember.email}" called ${duplicateMember.firstName} ${duplicateMember.lastName}`

        const error = new Error(errorMsg)
        error.name = 'DuplicateEmail'

        throw error
      }

      if (duplicateMember.whatsappNumber === args.whatsappNumber) {
        const errorMsg = `There is a member with this whatsapp number "${duplicateMember.whatsappNumber}" called ${duplicateMember.firstName} ${duplicateMember.lastName}`
        const error = new Error(errorMsg)
        error.name = 'DuplicateWhatsappNumber'
        throw error
      }
    }

    const createMemberResponse = await session.executeWrite((tx) =>
      tx.run(createMember, {
        firstName: args?.firstName ?? '',
        middleName: args?.middleName ?? null,
        lastName: args?.lastName ?? '',
        email: args?.email ?? null,
        phoneNumber: args?.phoneNumber ?? '',
        whatsappNumber: args?.whatsappNumber ?? '',
        dob: args?.dob ?? '',
        maritalStatus: args?.maritalStatus ?? '',
        gender: args?.gender ?? '',
        occupation: args?.occupation ?? '',
        bacenta: args?.bacenta ?? '',
        basonta: args?.basonta ?? '',
        visitationArea: args?.visitationArea ?? '',
        pictureUrl: args?.pictureUrl ?? '',
        auth_id: context.auth.jwt.sub ?? '',
      })
    )

    const member = rearrangeCypherObject(createMemberResponse)
    await session.close()

    return member
  },
  UpdateMemberBacenta: async (
    object: Member,
    args: { memberId: string; bacentaId: string },
    context: Context
  ) => {
    isAuth(
      [...permitMe('Bacenta'), ...permitMe('Hub'), ...permitSheepSeeker()],
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()

    const memberRes = await session.executeRead((tx) =>
      tx.run(matchMemberAndIMCLStatus, {
        id: args.memberId,
      })
    )

    const member = memberRes.records[0]?.get('member').properties

    if (member?.imclChecked === false) {
      throw new Error(
        'You cannot move this member without filling IMCL details for them'
      )
    }

    const moveRes = await session.executeWrite((tx) =>
      tx.run(updateMemberBacenta, {
        id: args.memberId,
        bacentaId: args.bacentaId,
      })
    )

    const updatedMember = moveRes.records[0]?.get('member').properties

    return updatedMember
  },
  UpdateMemberEmail: async (
    object: Member,
    args: { id: string; email: string },
    context: Context
  ) => {
    isAuth(
      [...permitMe('Fellowship'), ...permitMe('Hub'), ...permitSheepSeeker()],
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const authToken: string = await getAuthToken()
    const session = context.executionContext.session()

    const member = rearrangeCypherObject(
      await session.executeRead((tx) =>
        tx.run(matchMemberQuery, {
          id: args.id,
        })
      )
    )

    const updatedMember: Member = rearrangeCypherObject(
      await session.executeWrite((tx) =>
        tx.run(updateMemberEmail, {
          id: args.id,
          email: args.email,
        })
      )
    )

    if (member.auth_id) {
      // Update a user's Auth Profile with Picture and Name Details
      await axios(updateAuthUserConfig(updatedMember, authToken))
    }

    await session.close()

    return updatedMember
  },
  MakeMemberInactive: async (
    object: any,
    args: {
      id: string
      reason: string
    },
    context: Context
  ) => {
    isAuth(
      [...permitLeaderAdmin('Governorship'), ...permitSheepSeeker()],
      context.jwt['https://flcadmin.netlify.app/roles']
    )
    const session = context.executionContext.session()

    const memberCheck = rearrangeCypherObject(
      await session.run(cypher.checkMemberHasNoActiveRelationships, args)
    )

    if (memberCheck.relationshipCount.low > 0) {
      throw new Error(
        'This member has active roles in church. Please remove all active roles and try again'
      )
    }

    let mutation = makeMemberInactive

    if (args.reason.toLowerCase().includes('duplicate')) {
      mutation = removeDuplicateMember
    }

    const member = rearrangeCypherObject(
      await session.run(mutation, {
        id: args.id,
        reason: args.reason,
        auth: context.auth,
      })
    )

    await session.close()
    return member?.properties
  },
  CloseDownFellowship: async (object: any, args: any, context: Context) => {
    isAuth(
      permitAdmin('Governorship'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    const res: any = await Promise.all([
      session.run(closeChurchCypher.checkFellowshipHasNoMembers, args),
      sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
        churchId: args.fellowshipId,
      }),
    ]).catch((error: any) => {
      throwToSentry(
        'There was an error running checkFellowshipHasNoMembers',
        error
      )
    })

    const fellowshipCheck = rearrangeCypherObject(res[0])
    const lastServiceRecord = rearrangeCypherObject(res[1])

    if (fellowshipCheck.memberCount > 0) {
      throw new Error(
        `${fellowshipCheck?.name} Fellowship has ${fellowshipCheck?.memberCount} members. Please transfer all members and try again.`
      )
    }

    const record = lastServiceRecord.lastService?.properties ?? {
      bankingSlip: null,
    }

    if (
      !(
        'bankingSlip' in record ||
        record.transactionStatus === 'success' ||
        'tellerConfirmationTime' in record
      )
    ) {
      throw new Error(
        `Please bank outstanding offering for your service filled on ${getHumanReadableDate(
          record.createdAt
        )} before attempting to bank this week's offering`
      )
    }

    try {
      // Fellowship Leader must be removed since the fellowship is being closed down
      await RemoveServant(
        context,
        args,
        ['adminCampus', 'adminStream', 'adminCouncil', 'adminGovernorship'],
        'Fellowship',
        'Leader',
        true
      )

      const closeFellowshipResponse = await session.run(
        closeChurchCypher.closeDownFellowship,
        {
          auth: context.auth,
          fellowshipId: args.fellowshipId,
        }
      )

      const fellowshipResponse = rearrangeCypherObject(closeFellowshipResponse) // Returns a Bacenta

      return fellowshipResponse.bacenta
    } catch (error: any) {
      throwToSentry('', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },

  CloseDownBacenta: async (object: any, args: any, context: Context) => {
    isAuth(
      permitAdminArrivals('Governorship'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()

    try {
      const bacentaCheckResponse = await session.run(
        closeChurchCypher.checkBacentaHasNoMembers,
        args
      )
      const bacentaCheck = rearrangeCypherObject(bacentaCheckResponse)

      if (bacentaCheck.memberCount > 0) {
        throw new Error(
          `${bacentaCheck?.name} Bacenta has ${bacentaCheck?.memberCount} members. Please transfer all members and try again.`
        )
      }

      // Bacenta Leader must be removed since the Bacenta is being closed down
      await RemoveServant(
        context,
        args,
        permitAdmin('Governorship'),
        'Bacenta',
        'Leader',
        true
      )

      const closeBacentaResponse = await session.run(
        closeChurchCypher.closeDownBacenta,
        {
          auth: context.auth,
          bacentaId: args.bacentaId,
        }
      )

      const bacentaResponse = rearrangeCypherObject(closeBacentaResponse)
      return bacentaResponse.governorship
    } catch (error: any) {
      throwToSentry('a', error)
    } finally {
      await session.close()
    }
    return null
  },
  CloseDownGovernorship: async (object: any, args: any, context: Context) => {
    isAuth(
      permitAdmin('Council'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    const res: any = await Promise.all([
      session.run(closeChurchCypher.checkGovernorshipHasNoMembers, args),
      sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
        churchId: args.governorshipId,
      }),
    ]).catch((error: any) => {
      throwToSentry(
        'There was an error running checkGovernorshipHasNoMembers',
        error
      )
    })

    const governorshipCheck = rearrangeCypherObject(res[0])
    const lastServiceRecord = rearrangeCypherObject(res[1])

    if (governorshipCheck.bacentaCount.toNumber()) {
      throw new Error(
        `${governorshipCheck?.name} Governorship has ${governorshipCheck?.bacentaCount} active bacentas. Please close down all bacentas and try again.`
      )
    }
    if (governorshipCheck.hubCount.toNumber()) {
      throw new Error(
        `${governorshipCheck?.name} Governorship has ${governorshipCheck?.hubCount} active hubs. Please close down all hubs and try again.`
      )
    }

    const record = lastServiceRecord.lastService?.properties ?? {
      bankingSlip: null,
    }

    if (
      !(
        'bankingSlip' in record ||
        record.transactionStatus === 'success' ||
        'tellerConfirmationTime' in record
      )
    ) {
      throw new Error(
        `Please bank outstanding offering for your service filled on ${getHumanReadableDate(
          record.createdAt
        )} before attempting to close down this governorship`
      )
    }

    try {
      // Bacenta Leader must be removed since the Bacenta is being closed down
      await Promise.all([
        RemoveServant(
          context,
          args,
          permitAdmin('Council'),
          'Governorship',
          'Leader',
          true
        ),
        args.adminId
          ? RemoveServant(
              context,
              args,
              permitAdmin('Council'),
              'Governorship',
              'Admin'
            )
          : null,
      ])

      const closeGovernorshipResponse = await session.run(
        closeChurchCypher.closeDownGovernorship,
        {
          auth: context.auth,
          governorshipId: args.governorshipId,
        }
      )

      const governorshipResponse = rearrangeCypherObject(
        closeGovernorshipResponse
      )
      return governorshipResponse.council
    } catch (error: any) {
      throwToSentry('There was an error closing down this governorship', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },

  CloseDownCouncil: async (object: any, args: any, context: Context) => {
    isAuth(
      permitAdmin('Stream'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    const res: any = await Promise.all([
      session.run(closeChurchCypher.checkCouncilHasNoMembers, args),
      sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
        churchId: args.councilId,
      }),
    ]).catch((error: any) => {
      throwToSentry(
        'There was an error running checkCouncilHasNoMembers',
        error
      )
    })

    const councilCheck = rearrangeCypherObject(res[0])
    const lastServiceRecord = rearrangeCypherObject(res[1])

    if (councilCheck.governorshipCount.toNumber()) {
      throw new Error(
        `${councilCheck?.name} Council has ${councilCheck?.governorshipCount} active governorships. Please close down all governorships and try again.`
      )
    }

    if (councilCheck.hubCouncilLeaderCount.toNumber()) {
      throw new Error(
        `${councilCheck?.name} Council has ${councilCheck?.hubCouncilCount} active hub councils. Please close down all hub councils and try again.`
      )
    }

    const record = lastServiceRecord.lastService?.properties ?? {
      bankingSlip: null,
    }

    if (
      !(
        'bankingSlip' in record ||
        record.transactionStatus === 'success' ||
        'tellerConfirmationTime' in record
      )
    ) {
      throw new Error(
        `Please bank outstanding offering for your service filled on ${getHumanReadableDate(
          record.createdAt
        )} before attempting to close down this council`
      )
    }

    try {
      // Council Leader must be removed since the Council is being closed down
      await Promise.all([
        RemoveServant(
          context,
          args,
          permitAdmin('Stream'),
          'Council',
          'Leader',
          true
        ),
        args.adminId
          ? RemoveServant(
              context,
              args,
              permitAdmin('Stream'),
              'Council',
              'Admin'
            )
          : null,
      ])

      const closeCouncilResponse = await session.run(
        closeChurchCypher.closeDownCouncil,
        {
          auth: context.auth,
          councilId: args.councilId,
        }
      )

      const councilResponse = rearrangeCypherObject(closeCouncilResponse)
      return councilResponse.stream
    } catch (error: any) {
      throwToSentry('There was an error closing down this council', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },

  CloseDownStream: async (object: any, args: any, context: Context) => {
    isAuth(
      permitAdmin('Campus'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    const res: any = await Promise.all([
      session.run(closeChurchCypher.checkStreamHasNoMembers, args),
      sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
        churchId: args.streamId,
      }),
    ]).catch((error: any) => {
      throwToSentry('There was an error running checkStreamHasNoMembers', error)
    })

    const streamCheck = rearrangeCypherObject(res[0])
    const lastServiceRecord = rearrangeCypherObject(res[1])

    if (streamCheck.memberCount > 0) {
      throw new Error(
        `${streamCheck?.name} Stream has ${streamCheck?.councilCount} active councils. Please close down all councils and try again.`
      )
    }

    if (streamCheck.ministryLeaderCount > 0) {
      throw new Error(
        `${streamCheck?.name} Stream has ${streamCheck?.ministryCount} active ministries. Please close down all ministries and try again.`
      )
    }

    const record = lastServiceRecord.lastService?.properties ?? {
      bankingSlip: null,
    }

    if (
      !(
        'bankingSlip' in record ||
        record.transactionStatus === 'success' ||
        'tellerConfirmationTime' in record
      )
    ) {
      throw new Error(
        `Please bank outstanding offering for your service filled on ${getHumanReadableDate(
          record.createdAt
        )} before attempting to close down this stream`
      )
    }

    try {
      // Stream Leader must be removed since the Stream is being closed down
      await Promise.all([
        RemoveServant(
          context,
          args,
          permitAdmin('Campus'),
          'Stream',
          'Leader',
          true
        ),
        args.adminId
          ? RemoveServant(
              context,
              args,
              permitAdmin('Campus'),
              'Stream',
              'Admin'
            )
          : null,
      ])

      const closeStreamResponse = await session.run(
        closeChurchCypher.closeDownStream,
        {
          auth: context.auth,
          streamId: args.streamId,
        }
      )

      const streamResponse = rearrangeCypherObject(closeStreamResponse)
      return streamResponse.campus
    } catch (error: any) {
      throwToSentry('There was an error closing down this stream', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },

  CloseDownCampus: async (object: any, args: any, context: Context) => {
    isAuth(
      permitAdmin('Oversight'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    const res: any = await Promise.all([
      session.run(closeChurchCypher.checkCampusHasNoMembers, args),
      sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
        churchId: args.campusId,
      }),
    ]).catch((error: any) => {
      throwToSentry('There was an error running checkCampusHasNoMembers', error)
    })

    const campusCheck = rearrangeCypherObject(res[0])
    const lastServiceRecord = rearrangeCypherObject(res[1])

    if (campusCheck.memberCount > 0) {
      throw new Error(
        `${campusCheck?.name} Campus has ${campusCheck?.streamCount} active streams. Please close down all streams and try again.`
      )
    }

    if (campusCheck.leaderCount > 0) {
      throw new Error(
        `${campusCheck?.name} Campus has ${campusCheck?.creativeArtsCount} active creativeArts. Please close down all creativeArts and try again.`
      )
    }

    const record = lastServiceRecord.lastService?.properties ?? {
      bankingSlip: null,
    }

    if (
      !(
        'bankingSlip' in record ||
        record.transactionStatus === 'success' ||
        'tellerConfirmationTime' in record
      )
    ) {
      throw new Error(
        `Please bank outstanding offering for your service filled on ${getHumanReadableDate(
          record.createdAt
        )} before attempting to close down this campus`
      )
    }

    try {
      // Stream Leader must be removed since the Stream is being closed down
      await Promise.all([
        RemoveServant(
          context,
          args,
          permitAdmin('Oversight'),
          'Campus',
          'Leader',
          true
        ),
        args.adminId
          ? RemoveServant(
              context,
              args,
              permitAdmin('Oversight'),
              'Campus',
              'Admin'
            )
          : null,
      ])

      const closeCampusResponse = await session.run(
        closeChurchCypher.closeDownCampus,
        {
          auth: context.auth,
          campusId: args.campusId,
        }
      )

      const campusResponse = rearrangeCypherObject(closeCampusResponse)
      return campusResponse.oversight
    } catch (error: any) {
      throwToSentry('There was an error closing down this campus', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },

  CloseDownOversight: async (object: any, args: any, context: Context) => {
    isAuth(
      permitAdmin('Denomination'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    const res: any = await Promise.all([
      session.run(closeChurchCypher.checkOversightHasNoMembers, args),
      sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
        churchId: args.oversightId,
      }),
    ]).catch((error: any) => {
      throwToSentry(
        'There was an error running checkOversightHasNoMembers',
        error
      )
    })

    const oversightCheck = rearrangeCypherObject(res[0])
    const lastServiceRecord = rearrangeCypherObject(res[1])

    if (oversightCheck.memberCount) {
      throw new Error(
        `${oversightCheck?.name} Oversight has ${oversightCheck?.campusCount} active campuses. Please close down all campuses and try again.`
      )
    }

    const record = lastServiceRecord.lastService?.properties ?? {
      bankingSlip: null,
    }

    if (
      !(
        'bankingSlip' in record ||
        record.transactionStatus === 'success' ||
        'tellerConfirmationTime' in record
      )
    ) {
      throw new Error(
        `Please bank outstanding offering for your service filled on ${getHumanReadableDate(
          record.createdAt
        )} before attempting to close down this campus`
      )
    }

    try {
      // Stream Leader must be removed since the Stream is being closed down
      await Promise.all([
        RemoveServant(
          context,
          args,
          permitAdmin('Denomination'),
          'Oversight',
          'Leader',
          true
        ),
        args.adminId
          ? RemoveServant(
              context,
              args,
              permitAdmin('Denomination'),
              'Oversight',
              'Admin'
            )
          : null,
      ])

      const closeOversightResponse = await session.run(
        closeChurchCypher.closeDownOversight,
        {
          auth: context.auth,
          oversightId: args.oversightId,
        }
      )

      const oversightResponse = rearrangeCypherObject(closeOversightResponse)
      return oversightResponse.denomination
    } catch (error: any) {
      throwToSentry('There was an error closing down this Oversight', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },
  CreateMemberAccount: async (object: any, args: any, context: Context) => {
    const authToken = await getAuthToken()
    const session = context.executionContext.session()

    const memberRes = await session.executeRead((tx) =>
      tx.run(matchMemberQuery, {
        id: args.memberId,
      })
    )

    const member = memberRes.records[0]?.get('member')
    const authIdResponse = await axios(getAuthIdConfig(member, authToken))

    if (!authIdResponse.data[0]?.user_id) {
      const authProfileResponse = await axios(
        createAuthUserConfig(member, authToken)
      )
      const passwordTicketResponse = await axios(
        changePasswordConfig(member, authToken)
      )

      const res = await Promise.all([
        session.executeWrite((tx) =>
          tx.run(updateMemberAuthId, {
            id: args.memberId,
            auth_id: authProfileResponse.data.user_id,
          })
        ),
        sendSingleEmail(
          member,
          'Welcome to the My First Love Portal',
          undefined,
          `<p>Hi ${member.firstName} ${member.lastName},<br/><br/>Welcome to your First Love Membership Portal</b>.<br/><br/>Your account has just been created. Please set up your password by clicking <b><a href=${passwordTicketResponse.data.ticket}>this link</a></b>. After setting up your password, you can log in by clicking <b>https://my.firstlovecenter.com/</b><br/><br/>${texts.html.subscription}`
        ),
      ])

      return res[0].records[0]?.get('member').properties
    }

    if (!member.auth_id && authIdResponse.data[0]?.user_id) {
      const res = await session.executeWrite((tx) =>
        tx.run(updateMemberAuthId, {
          id: args.memberId,
          auth_id: authIdResponse.data[0]?.user_id,
        })
      )

      return res.records[0]?.get('member').properties
    }

    return member
  },
}

export default directoryMutation
