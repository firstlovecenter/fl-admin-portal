import axios from 'axios'
import { getHumanReadableDate } from 'jd-date-utils'
import { Context } from '../utils/neo4j-types'
import { Member } from '../utils/types'
import { isAuth, rearrangeCypherObject, throwToSentry } from '../utils/utils'
import {
  permitAdmin,
  permitLeaderAdmin,
  permitAdminArrivals,
  permitLeader,
  permitMe,
} from '../permissions'
import { RemoveServant } from './make-remove-servants'

import {
  makeMemberInactive,
  matchMemberQuery,
  updateMemberEmail,
  createMember,
  activateInactiveMember,
  removeDuplicateMember,
  matchMemberAndIMCLStatus,
  updateMemberBacenta,
} from '../cypher/resolver-cypher'

const cypher = require('../cypher/resolver-cypher')
const closeChurchCypher = require('../cypher/close-church-cypher')

const directoryMutation = {
  CreateMember: async (object: any, args: Member, context: Context) => {
    isAuth(
      [...permitLeaderAdmin('Fellowship'), ...permitLeader('Hub')],
      context?.jwt.roles
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
    isAuth([...permitMe('Bacenta'), ...permitMe('Hub')], context.jwt.roles)

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
    isAuth([...permitMe('Fellowship'), ...permitMe('Hub')], context.jwt.roles)

    const session = context.executionContext.session()

    try {
      const updatedMember: Member = rearrangeCypherObject(
        await session.executeWrite((tx) =>
          tx.run(updateMemberEmail, {
            id: args.id,
            email: args.email,
          })
        )
      )

      return updatedMember
    } finally {
      await session.close()
    }
  },
  MakeMemberInactive: async (
    object: any,
    args: {
      id: string
      reason: string
    },
    context: Context
  ) => {
    isAuth([...permitLeaderAdmin('Governorship')], context.jwt.roles)
    const session = context.executionContext.session()

    try {
      const memberCheck = rearrangeCypherObject(
        await session.executeRead((tx) =>
          tx.run(cypher.checkMemberHasNoActiveRelationships, args)
        )
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
        await session.executeWrite((tx) =>
          tx.run(mutation, {
            id: args.id,
            reason: args.reason,
            jwt: context.jwt,
          })
        )
      )

      return member?.properties
    } finally {
      await session.close()
    }
  },
  CloseDownFellowship: async (object: any, args: any, context: Context) => {
    isAuth(permitAdmin('Governorship'), context.jwt.roles)

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    try {
      const res: any = await Promise.all([
        session.executeRead((tx) =>
          tx.run(closeChurchCypher.checkFellowshipHasNoMembers, args)
        ),
        sessionTwo.executeRead((tx) =>
          tx.run(closeChurchCypher.getLastServiceRecord, {
            churchId: args.fellowshipId,
          })
        ),
      ])

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
          )} before attempting to close down this fellowship`
        )
      }

      // Fellowship Leader must be removed since the fellowship is being closed down
      await RemoveServant(
        context,
        args,
        ['adminCampus', 'adminStream', 'adminCouncil', 'adminGovernorship'],
        'Fellowship',
        'Leader',
        true
      )

      const closeFellowshipResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownFellowship, {
          jwt: context.jwt,
          fellowshipId: args.fellowshipId,
        })
      )

      const fellowshipResponse = rearrangeCypherObject(closeFellowshipResponse)
      return fellowshipResponse.bacenta
    } catch (error: any) {
      throwToSentry('Error closing down fellowship', error)
      throw error
    } finally {
      await session.close()
      await sessionTwo.close()
    }
  },

  CloseDownBacenta: async (object: any, args: any, context: Context) => {
    isAuth(permitAdminArrivals('Governorship'), context.jwt.roles)

    const session = context.executionContext.session()

    try {
      const bacentaCheckResponse = await session.executeRead((tx) =>
        tx.run(closeChurchCypher.checkBacentaHasNoMembers, args)
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

      const closeBacentaResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownBacenta, {
          jwt: context.jwt,
          bacentaId: args.bacentaId,
        })
      )

      const bacentaResponse = rearrangeCypherObject(closeBacentaResponse)
      return bacentaResponse.governorship
    } catch (error: any) {
      throwToSentry('Error closing down bacenta', error)
      throw error
    } finally {
      await session.close()
    }
  },
  CloseDownGovernorship: async (object: any, args: any, context: Context) => {
    isAuth(permitAdmin('Council'), context.jwt.roles)

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    try {
      const res: any = await Promise.all([
        session.executeRead((tx) =>
          tx.run(closeChurchCypher.checkGovernorshipHasNoMembers, args)
        ),
        sessionTwo.executeRead((tx) =>
          tx.run(closeChurchCypher.getLastServiceRecord, {
            churchId: args.governorshipId,
          })
        ),
      ])

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

      // Remove Governorship Leader and Admin
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

      const closeGovernorshipResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownGovernorship, {
          jwt: context.jwt,
          governorshipId: args.governorshipId,
        })
      )

      const governorshipResponse = rearrangeCypherObject(
        closeGovernorshipResponse
      )
      return governorshipResponse.council
    } catch (error: any) {
      throwToSentry('Error closing down governorship', error)
      throw error
    } finally {
      await session.close()
      await sessionTwo.close()
    }
  },

  CloseDownCouncil: async (object: any, args: any, context: Context) => {
    isAuth(permitAdmin('Stream'), context.jwt.roles)

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    try {
      const res: any = await Promise.all([
        session.executeRead((tx) =>
          tx.run(closeChurchCypher.checkCouncilHasNoMembers, args)
        ),
        sessionTwo.executeRead((tx) =>
          tx.run(closeChurchCypher.getLastServiceRecord, {
            churchId: args.councilId,
          })
        ),
      ])

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

      // Remove Council Leader and Admin
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

      const closeCouncilResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownCouncil, {
          jwt: context.jwt,
          councilId: args.councilId,
        })
      )

      const councilResponse = rearrangeCypherObject(closeCouncilResponse)
      return councilResponse.stream
    } catch (error: any) {
      throwToSentry('Error closing down council', error)
      throw error
    } finally {
      await session.close()
      await sessionTwo.close()
    }
  },

  CloseDownStream: async (object: any, args: any, context: Context) => {
    isAuth(permitAdmin('Campus'), context.jwt.roles)

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    try {
      const res: any = await Promise.all([
        session.executeRead((tx) =>
          tx.run(closeChurchCypher.checkStreamHasNoMembers, args)
        ),
        sessionTwo.executeRead((tx) =>
          tx.run(closeChurchCypher.getLastServiceRecord, {
            churchId: args.streamId,
          })
        ),
      ])

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

      // Remove Stream Leader and Admin
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

      const closeStreamResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownStream, {
          jwt: context.jwt,
          streamId: args.streamId,
        })
      )

      const streamResponse = rearrangeCypherObject(closeStreamResponse)
      return streamResponse.campus
    } catch (error: any) {
      throwToSentry('Error closing down stream', error)
      throw error
    } finally {
      await session.close()
      await sessionTwo.close()
    }
  },

  CloseDownCampus: async (object: any, args: any, context: Context) => {
    isAuth(permitAdmin('Oversight'), context.jwt.roles)

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    try {
      const res: any = await Promise.all([
        session.executeRead((tx) =>
          tx.run(closeChurchCypher.checkCampusHasNoMembers, args)
        ),
        sessionTwo.executeRead((tx) =>
          tx.run(closeChurchCypher.getLastServiceRecord, {
            churchId: args.campusId,
          })
        ),
      ])

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

      // Remove Campus Leader and Admin
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

      const closeCampusResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownCampus, {
          jwt: context.jwt,
          campusId: args.campusId,
        })
      )

      const campusResponse = rearrangeCypherObject(closeCampusResponse)
      return campusResponse.oversight
    } catch (error: any) {
      throwToSentry('Error closing down campus', error)
      throw error
    } finally {
      await session.close()
      await sessionTwo.close()
    }
  },

  CloseDownOversight: async (object: any, args: any, context: Context) => {
    isAuth(permitAdmin('Denomination'), context.jwt.roles)

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    try {
      const res: any = await Promise.all([
        session.executeRead((tx) =>
          tx.run(closeChurchCypher.checkOversightHasNoMembers, args)
        ),
        sessionTwo.executeRead((tx) =>
          tx.run(closeChurchCypher.getLastServiceRecord, {
            churchId: args.oversightId,
          })
        ),
      ])

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
          )} before attempting to close down this oversight`
        )
      }

      // Remove Oversight Leader and Admin
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

      const closeOversightResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownOversight, {
          jwt: context.jwt,
          oversightId: args.oversightId,
        })
      )

      const oversightResponse = rearrangeCypherObject(closeOversightResponse)
      return oversightResponse.denomination
    } catch (error: any) {
      throwToSentry('Error closing down oversight', error)
      throw error
    } finally {
      await session.close()
      await sessionTwo.close()
    }
  },
}

export default directoryMutation
