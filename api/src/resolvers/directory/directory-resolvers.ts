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
    console.log(
      '🟢 CreateMember mutation started with args:',
      JSON.stringify(args)
    )
    isAuth(
      [...permitLeaderAdmin('Fellowship'), ...permitLeader('Hub')],
      context?.jwt.roles
    )
    console.log('✅ CreateMember: Auth passed')
    const session = context.executionContext.session()
    console.log('📋 CreateMember: Checking for inactive member')
    const inactiveMemberResponse = rearrangeCypherObject(
      await session.executeRead((tx) =>
        tx.run(cypher.checkInactiveMember, {
          email: args.email ?? null,
          whatsappNumber: args?.whatsappNumber ?? null,
        })
      )
    )
    console.log(
      '📋 CreateMember: Inactive member response:',
      inactiveMemberResponse
    )

    if (inactiveMemberResponse.count > 0) {
      console.log('🔄 CreateMember: Found inactive member, activating...')
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
      console.log('✅ CreateMember: Inactive member activated:', member)
      return member
    }

    console.log('📋 CreateMember: Checking if member email/whatsapp exists')
    const memberResponse = await session.executeRead((tx) =>
      tx.run(cypher.checkMemberEmailExists, {
        email: args.email ?? null,
        whatsappNumber: args?.whatsappNumber ?? null,
      })
    )
    const memberCheck = rearrangeCypherObject(memberResponse, true)[0]
    console.log('📋 CreateMember: Member check result:', memberCheck)
    const duplicateMember = memberCheck.member?.properties

    if (memberCheck.predicate) {
      console.log('⚠️ CreateMember: Duplicate member found:', duplicateMember)
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

    console.log('📋 CreateMember: Creating new member')
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
    console.log('✅ CreateMember: Member created successfully:', member)
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
    console.log('🟡 CloseDownFellowship mutation started with args:', args)
    isAuth(permitAdmin('Governorship'), context.jwt.roles)
    console.log('✅ CloseDownFellowship: Auth passed')

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
      console.log('📋 CloseDownFellowship: Fellowship check:', fellowshipCheck)
      const lastServiceRecord = rearrangeCypherObject(res[1])
      console.log(
        '📋 CloseDownFellowship: Last service record:',
        lastServiceRecord
      )

      if (fellowshipCheck.memberCount > 0) {
        console.log('❌ CloseDownFellowship: Fellowship has members')
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

      console.log('📋 CloseDownFellowship: Executing close down query')
      const closeFellowshipResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownFellowship, {
          jwt: context.jwt,
          fellowshipId: args.fellowshipId,
        })
      )
      console.log(
        '📋 CloseDownFellowship: Raw response:',
        closeFellowshipResponse
      )

      const fellowshipResponse = rearrangeCypherObject(closeFellowshipResponse)
      console.log(
        '📋 CloseDownFellowship: Rearranged response:',
        fellowshipResponse
      )
      console.log(
        '📋 CloseDownFellowship: Returning bacenta:',
        fellowshipResponse.bacenta
      )
      return fellowshipResponse.bacenta
    } catch (error: any) {
      console.error(
        '❌ CloseDownFellowship: Error occurred:',
        error.message,
        error.stack
      )
      throwToSentry('Error closing down fellowship', error)
      throw error
    } finally {
      console.log('🧹 CloseDownFellowship: Closing sessions')
      await session.close()
      await sessionTwo.close()
    }
  },

  CloseDownBacenta: async (object: any, args: any, context: Context) => {
    console.log('🟡 CloseDownBacenta mutation started with args:', args)
    isAuth(permitAdminArrivals('Governorship'), context.jwt.roles)
    console.log('✅ CloseDownBacenta: Auth passed')

    const session = context.executionContext.session()

    try {
      console.log('📋 CloseDownBacenta: Checking bacenta...')
      const bacentaCheckResponse = await session.executeRead((tx) =>
        tx.run(closeChurchCypher.checkBacentaHasNoMembers, args)
      )
      const bacentaCheck = rearrangeCypherObject(bacentaCheckResponse)
      console.log('📋 CloseDownBacenta: Bacenta check:', bacentaCheck)

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

      console.log('📋 CloseDownBacenta: Executing close down query')
      const closeBacentaResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownBacenta, {
          jwt: context.jwt,
          bacentaId: args.bacentaId,
        })
      )
      console.log('📋 CloseDownBacenta: Raw response:', closeBacentaResponse)

      const bacentaResponse = rearrangeCypherObject(closeBacentaResponse)
      console.log('📋 CloseDownBacenta: Rearranged response:', bacentaResponse)
      console.log(
        '📋 CloseDownBacenta: Returning governorship:',
        bacentaResponse.governorship
      )
      return bacentaResponse.governorship
    } catch (error: any) {
      console.error(
        '❌ CloseDownBacenta: Error occurred:',
        error.message,
        error.stack
      )
      throwToSentry('Error closing down bacenta', error)
      throw error
    } finally {
      console.log('🧹 CloseDownBacenta: Closing session')
      await session.close()
    }
  },
  CloseDownGovernorship: async (object: any, args: any, context: Context) => {
    console.log('🟡 CloseDownGovernorship mutation started with args:', args)
    isAuth(permitAdmin('Council'), context.jwt.roles)
    console.log('✅ CloseDownGovernorship: Auth passed')

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
      console.log(
        '📋 CloseDownGovernorship: Governorship check:',
        governorshipCheck
      )
      const lastServiceRecord = rearrangeCypherObject(res[1])
      console.log(
        '📋 CloseDownGovernorship: Last service record:',
        lastServiceRecord
      )

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

      console.log('📋 CloseDownGovernorship: Executing close down query')
      const closeGovernorshipResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownGovernorship, {
          jwt: context.jwt,
          governorshipId: args.governorshipId,
        })
      )
      console.log(
        '📋 CloseDownGovernorship: Raw response:',
        closeGovernorshipResponse
      )

      const governorshipResponse = rearrangeCypherObject(
        closeGovernorshipResponse
      )
      console.log(
        '📋 CloseDownGovernorship: Rearranged response:',
        governorshipResponse
      )
      console.log(
        '📋 CloseDownGovernorship: Returning council:',
        governorshipResponse.council
      )
      return governorshipResponse.council
    } catch (error: any) {
      console.error(
        '❌ CloseDownGovernorship: Error occurred:',
        error.message,
        error.stack
      )
      throwToSentry('Error closing down governorship', error)
      throw error
    } finally {
      console.log('🧹 CloseDownGovernorship: Closing sessions')
      await session.close()
      await sessionTwo.close()
    }
  },

  CloseDownCouncil: async (object: any, args: any, context: Context) => {
    console.log('🟡 CloseDownCouncil mutation started with args:', args)
    isAuth(permitAdmin('Stream'), context.jwt.roles)
    console.log('✅ CloseDownCouncil: Auth passed')

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
      console.log('📋 CloseDownCouncil: Council check:', councilCheck)
      const lastServiceRecord = rearrangeCypherObject(res[1])
      console.log(
        '📋 CloseDownCouncil: Last service record:',
        lastServiceRecord
      )

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

      console.log('📋 CloseDownCouncil: Executing close down query')
      const closeCouncilResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownCouncil, {
          jwt: context.jwt,
          councilId: args.councilId,
        })
      )
      console.log('📋 CloseDownCouncil: Raw response:', closeCouncilResponse)

      const councilResponse = rearrangeCypherObject(closeCouncilResponse)
      console.log('📋 CloseDownCouncil: Rearranged response:', councilResponse)
      console.log(
        '📋 CloseDownCouncil: Returning stream:',
        councilResponse.stream
      )
      return councilResponse.stream
    } catch (error: any) {
      console.error(
        '❌ CloseDownCouncil: Error occurred:',
        error.message,
        error.stack
      )
      throwToSentry('Error closing down council', error)
      throw error
    } finally {
      console.log('🧹 CloseDownCouncil: Closing sessions')
      await session.close()
      await sessionTwo.close()
    }
  },

  CloseDownStream: async (object: any, args: any, context: Context) => {
    console.log('🟡 CloseDownStream mutation started with args:', args)
    isAuth(permitAdmin('Campus'), context.jwt.roles)
    console.log('✅ CloseDownStream: Auth passed')

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
      console.log('📋 CloseDownStream: Stream check:', streamCheck)
      const lastServiceRecord = rearrangeCypherObject(res[1])
      console.log('📋 CloseDownStream: Last service record:', lastServiceRecord)

      if (streamCheck.memberCount > 0) {
        console.log('❌ CloseDownStream: Stream has members')
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
      console.log('📋 CloseDownStream: Removing stream leader...')
      try {
        const leaderRemovalResult = await RemoveServant(
          context,
          args,
          permitAdmin('Campus'),
          'Stream',
          'Leader',
          true
        )
        console.log('✅ CloseDownStream: Leader removed:', leaderRemovalResult)
      } catch (leaderError: any) {
        console.error(
          '⚠️ CloseDownStream: Leader removal failed:',
          leaderError.message
        )
        throw leaderError
      }

      if (args.adminId) {
        console.log('📋 CloseDownStream: Removing stream admin...')
        try {
          const adminRemovalResult = await RemoveServant(
            context,
            args,
            permitAdmin('Campus'),
            'Stream',
            'Admin'
          )
          console.log('✅ CloseDownStream: Admin removed:', adminRemovalResult)
        } catch (adminError: any) {
          console.error(
            '⚠️ CloseDownStream: Admin removal failed:',
            adminError.message
          )
          throw adminError
        }
      }

      console.log('📋 CloseDownStream: Executing close down query')
      const closeStreamResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownStream, {
          jwt: context.jwt,
          streamId: args.streamId,
        })
      )
      console.log(
        '📋 CloseDownStream: Raw response records length:',
        closeStreamResponse.records.length
      )

      if (closeStreamResponse.records.length === 0) {
        console.error('❌ CloseDownStream: Query returned no records')
        console.log(
          '📋 CloseDownStream: Query text:',
          closeStreamResponse.summary?.query?.text
        )
        throw new Error(
          'Failed to close stream: no data returned from database'
        )
      }

      console.log('📋 CloseDownStream: Raw response:', closeStreamResponse)

      const streamResponse = rearrangeCypherObject(closeStreamResponse)
      console.log('📋 CloseDownStream: Rearranged response:', streamResponse)
      console.log('📋 CloseDownStream: Returning campus:', streamResponse)
      return streamResponse
    } catch (error: any) {
      console.error(
        '❌ CloseDownStream: Error occurred:',
        error.message,
        error.stack
      )
      throwToSentry('Error closing down stream', error)
      throw error
    } finally {
      console.log('🧹 CloseDownStream: Closing sessions')
      await session.close()
      await sessionTwo.close()
    }
  },

  CloseDownCampus: async (object: any, args: any, context: Context) => {
    console.log('🟡 CloseDownCampus mutation started with args:', args)
    isAuth(permitAdmin('Oversight'), context.jwt.roles)
    console.log('✅ CloseDownCampus: Auth passed')

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
      console.log('📋 CloseDownCampus: Campus check:', campusCheck)
      const lastServiceRecord = rearrangeCypherObject(res[1])
      console.log('📋 CloseDownCampus: Last service record:', lastServiceRecord)

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

      console.log('📋 CloseDownCampus: Executing close down query')
      const closeCampusResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownCampus, {
          jwt: context.jwt,
          campusId: args.campusId,
        })
      )
      console.log('📋 CloseDownCampus: Raw response:', closeCampusResponse)

      const campusResponse = rearrangeCypherObject(closeCampusResponse)
      console.log('📋 CloseDownCampus: Rearranged response:', campusResponse)
      console.log(
        '📋 CloseDownCampus: Returning oversight:',
        campusResponse.oversight
      )
      return campusResponse.oversight
    } catch (error: any) {
      console.error(
        '❌ CloseDownCampus: Error occurred:',
        error.message,
        error.stack
      )
      throwToSentry('Error closing down campus', error)
      throw error
    } finally {
      console.log('🧹 CloseDownCampus: Closing sessions')
      await session.close()
      await sessionTwo.close()
    }
  },

  CloseDownOversight: async (object: any, args: any, context: Context) => {
    console.log('🟡 CloseDownOversight mutation started with args:', args)
    isAuth(permitAdmin('Denomination'), context.jwt.roles)
    console.log('✅ CloseDownOversight: Auth passed')

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
      console.log('📋 CloseDownOversight: Oversight check:', oversightCheck)
      const lastServiceRecord = rearrangeCypherObject(res[1])
      console.log(
        '📋 CloseDownOversight: Last service record:',
        lastServiceRecord
      )

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

      console.log('📋 CloseDownOversight: Executing close down query')
      const closeOversightResponse = await session.executeWrite((tx) =>
        tx.run(closeChurchCypher.closeDownOversight, {
          jwt: context.jwt,
          oversightId: args.oversightId,
        })
      )
      console.log(
        '📋 CloseDownOversight: Raw response:',
        closeOversightResponse
      )

      const oversightResponse = rearrangeCypherObject(closeOversightResponse)
      console.log(
        '📋 CloseDownOversight: Rearranged response:',
        oversightResponse
      )
      console.log(
        '📋 CloseDownOversight: Returning denomination:',
        oversightResponse.denomination
      )
      return oversightResponse.denomination
    } catch (error: any) {
      console.error(
        '❌ CloseDownOversight: Error occurred:',
        error.message,
        error.stack
      )
      throwToSentry('Error closing down oversight', error)
      throw error
    } finally {
      console.log('🧹 CloseDownOversight: Closing sessions')
      await session.close()
      await sessionTwo.close()
    }
  },
}

export default directoryMutation
