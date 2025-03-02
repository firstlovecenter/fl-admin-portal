import { getHumanReadableDate } from 'jd-date-utils'
import { Context } from '../utils/neo4j-types'
import { isAuth, rearrangeCypherObject, throwToSentry } from '../utils/utils'
import { permitAdmin } from '../permissions'

import { RemoveServant } from './make-remove-servants'

const closeChurchCypher = require('../cypher/close-church-creativearts-cypher')

const directoryCreativeArtsMutation = {
  CloseDownHub: async (object: unknown, args: any, context: Context) => {
    isAuth(
      permitAdmin('Hub'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()
    try {
      const res: any = await Promise.all([
        session.run(closeChurchCypher.checkHubHasNoMembers, args),
        sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
          churchId: args.hubId,
        }),
      ]).catch((error: any) => {
        throwToSentry('There was an error running checkHubHasNoMembers', error)
      })

      const hubCheck = rearrangeCypherObject(res[0])
      const lastServiceRecord = rearrangeCypherObject(res[1])

      if (hubCheck.memberCount) {
        throw new Error(
          `${hubCheck?.name} Hub has ${hubCheck?.fellowshipCount} active fellowships. Please close down all fellowships and try again.`
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
          )} before attempting to close down this hub`
        )
      }

      // Hub  Leader must be removed since the Hub is being closed down
      await Promise.all([
        RemoveServant(context, args, permitAdmin('Hub'), 'Hub', 'Leader', true),
        args.adminId
          ? RemoveServant(context, args, permitAdmin('Hub'), 'Hub', 'Admin')
          : null,
      ])

      const closeHubResponse = await session.run(
        closeChurchCypher.closeDownHub,
        {
          jwt: context.jwt,
          hubId: args.hubId,
        }
      )

      const hubResponse = rearrangeCypherObject(closeHubResponse)
      return hubResponse.hubCouncil
    } catch (error: any) {
      throwToSentry('There was an error closing down this hub', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },

  CloseDownHubCouncil: async (object: any, args: any, context: Context) => {
    isAuth(
      permitAdmin('HubCouncil'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()
    try {
      const res: any = await Promise.all([
        session.run(closeChurchCypher.checkHubCouncilHasNoMembers, args),
        sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
          churchId: args.hubCouncilId,
        }),
      ]).catch((error: any) => {
        throwToSentry(
          'There was an error running checkHubCouncilHasNoMembers',
          error
        )
      })

      const hubcouncilCheck = rearrangeCypherObject(res[0])
      const lastServiceRecord = rearrangeCypherObject(res[1])

      if (hubcouncilCheck.memberCount) {
        throw new Error(
          `${hubcouncilCheck?.name} HubCouncil has ${hubcouncilCheck?.hubCount} active hubs. Please close down all hubs and try again.`
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
          )} before attempting to close down this hub council`
        )
      }

      await Promise.all([
        RemoveServant(
          context,
          args,
          permitAdmin('HubCouncil'),
          'HubCouncil',
          'Leader',
          true
        ),
        args.adminId
          ? RemoveServant(
              context,
              args,
              permitAdmin('HubCouncil'),
              'HubCouncil',
              'Admin'
            )
          : null,
      ])

      const closeHubCouncilResponse = await session.run(
        closeChurchCypher.closeDownHubCouncil,
        {
          jwt: context.jwt,
          hubCouncilId: args.hubCouncilId,
        }
      )

      const hubCouncilResponse = rearrangeCypherObject(closeHubCouncilResponse)
      return hubCouncilResponse.ministry
    } catch (error: any) {
      throwToSentry('There was an error closing down this hubcouncil', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },

  CloseDownMinistry: async (object: any, args: any, context: Context) => {
    isAuth(
      permitAdmin('Ministry'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    const res: any = await Promise.all([
      session.run(closeChurchCypher.checkMinistryHasNoMembers, args),
      sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
        churchId: args.ministryId,
      }),
    ]).catch((error: any) => {
      throwToSentry(
        'There was an error running checkMinistryHasNoMembers',
        error
      )
    })

    const ministryCheck = rearrangeCypherObject(res[0])
    const lastServiceRecord = rearrangeCypherObject(res[1])

    if (ministryCheck.memberCount) {
      throw new Error(
        `${ministryCheck?.name} Ministry has ${ministryCheck?.hubCouncilCount} active hubcouncils. Please close down all hubcouncils and try again.`
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
        )} before attempting to close down this creative arts`
      )
    }

    try {
      // creative arts Leader must be removed since the creative art is being closed down
      await Promise.all([
        RemoveServant(
          context,
          args,
          permitAdmin('Ministry'),
          'Ministry',
          'Leader',
          true
        ),
        args.adminId
          ? RemoveServant(
              context,
              args,
              permitAdmin('Ministry'),
              'Ministry',
              'Admin'
            )
          : null,
      ])

      const closeMinistryResponse = await session.run(
        closeChurchCypher.closeDownMinistry,
        {
          jwt: context.jwt,
          ministryId: args.ministryId,
        }
      )

      const ministryResponse = rearrangeCypherObject(closeMinistryResponse)
      return ministryResponse.creativeArts
    } catch (error: any) {
      throwToSentry('There was an error closing down this ministry', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },

  CloseDownCreativeArts: async (object: any, args: any, context: Context) => {
    isAuth(
      permitAdmin('CreativeArts'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

    const res: any = await Promise.all([
      session.run(closeChurchCypher.checkCreativeArtsHasNoMembers, args),
    ]).catch((error: any) => {
      throwToSentry(
        'There was an error running checkCreativeArtsHasNoMembers',
        error
      )
    })

    const creativeArtsCheck = rearrangeCypherObject(res[0])

    if (creativeArtsCheck.memberCount) {
      throw new Error(
        `${creativeArtsCheck?.name} CreativeArt has ${creativeArtsCheck?.ministryCount} active ministries. Please close down all ministries and try again.`
      )
    }

    try {
      // creative arts Leader must be removed since the creative art is being closed down
      await Promise.all([
        RemoveServant(
          context,
          args,
          permitAdmin('CreativeArts'),
          'CreativeArts',
          'Leader',
          true
        ),
        args.adminId
          ? RemoveServant(
              context,
              args,
              permitAdmin('CreativeArts'),
              'CreativeArts',
              'Admin'
            )
          : null,
      ])

      const closeCreativeArtsResponse = await session.run(
        closeChurchCypher.closeDownCreativeArts,
        {
          jwt: context.jwt,
          creativeArtsId: args.creativeArtsId,
        }
      )

      const creativeArtsResponse = rearrangeCypherObject(
        closeCreativeArtsResponse
      )
      return creativeArtsResponse.campus
    } catch (error: any) {
      throwToSentry('There was an error closing down this CreativeArts', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },
}

export default directoryCreativeArtsMutation
