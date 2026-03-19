import { makeServantCypher } from '../directory/utils'
import { permitLeaderAdmin } from '../permissions'
import { Context } from '../utils/neo4j-types'
import {
  checkIfArrayHasRepeatingValues,
  isAuth,
  rearrangeCypherObject,
  throwToSentry,
} from '../utils/utils'
import { getCurrency, getHigherChurches } from './service-cypher'

import {
  checkCurrentServiceLog,
  getServantAndChurch as getServantAndChurchCypher,
  checkStreamServiceDay,
  recordSundayMinistryAttendance,
  recordHubRehearsalService,
  checkMinistryAttendanceFormFilledThisWeek,
  checkRehearsalFormFilledThisWeek,
  aggregateMinistryMeetingDataForCreativeArts,
  aggregateMinistryMeetingDataForMinistry,
  aggregateMinistryMeetingDataForHubCouncil,
  recordOnStageAttendance,
  checkMinistryStageAttendanceFormFilledThisWeek,
  recordCancelledOnStagePerformance,
} from './rehearsal-cypher'

const errorMessage = require('../texts.json').error

type RecordServiceArgs = {
  churchId: string
  serviceDate: string
  attendance: number
  income: number
  foreignCurrency: string
  numberOfTithers: number
  treasurers: string[]
  treasurerSelfie: string
  familyPicture: string
}

type RecordStageAttendanceArgs = {
  churchId: string
  serviceDate: string
  attendance: number
  onStagePictures: string[]
}

type RecordCancelledOnstageMinistryPerformanceArgs = {
  churchId: string
  serviceDate: string
  noServiceReason: string
}

export const checkServantHasCurrentHistory = async (
  session: any,
  context: Context,
  args: { churchId: string }
) => {
  const relationshipCheck = rearrangeCypherObject(
    await session.run(checkCurrentServiceLog, { churchId: args.churchId })
  )
  if (!relationshipCheck.exists) {
    const getServantAndChurch = rearrangeCypherObject(
      await session.run(getServantAndChurchCypher, { churchId: args.churchId })
    )
    if (Object.keys(getServantAndChurch).length === 0) {
      throw new Error(
        'You must set a leader over this church before you can fill this form'
      )
    }
    await makeServantCypher({
      context,
      churchType: getServantAndChurch.churchType,
      servantType: 'Leader',
      servant: {
        id: getServantAndChurch.servantId,

        firstName: getServantAndChurch.firstName,
        lastName: getServantAndChurch.lastName,
      },
      args: {
        leaderId: getServantAndChurch.servantId,
      },
      church: {
        id: getServantAndChurch.churchId,
        name: getServantAndChurch.churchName,
      },
    })
  }
}

const SontaServiceMutation = {
  RecordHubCouncilSundayAttendance: async (
    object: any,
    args: RecordServiceArgs,
    context: Context
  ) => {
    isAuth(permitLeaderAdmin('HubCouncil'), context.jwt.roles)
    const session = context.executionContext.session()

    await checkServantHasCurrentHistory(session, context, {
      churchId: args.churchId,
    })

    const serviceCheck = rearrangeCypherObject(
      await session.run(checkMinistryAttendanceFormFilledThisWeek, args)
    )

    if (
      serviceCheck.alreadyFilled &&
      !['Ministry', 'CreativeArts'].some((label) =>
        serviceCheck.higherChurchLabels?.includes(label)
      )
    ) {
      throw new Error(errorMessage.no_double_form_filling)
    }

    if (serviceCheck.labels?.includes('Vacation')) {
      throw new Error(errorMessage.vacation_cannot_fill_service)
    }

    const secondSession = context.executionContext.session()
    let aggregateCypher = ''

    if (serviceCheck.higherChurchLabels?.includes('HubCouncil')) {
      aggregateCypher = aggregateMinistryMeetingDataForHubCouncil
    } else if (serviceCheck.higherChurchLabels?.includes('Ministry')) {
      aggregateCypher = aggregateMinistryMeetingDataForMinistry
    } else if (serviceCheck.higherChurchLabels?.includes('CreativeArts')) {
      aggregateCypher = aggregateMinistryMeetingDataForCreativeArts
    }

    const cypherResponse = await session
      .run(recordSundayMinistryAttendance, {
        ...args,
        jwt: context.jwt,
      })
      .catch((error: any) =>
        throwToSentry('Error fellowship ministry attendance meeting', error)
      )

    secondSession
      .run(aggregateCypher, {
        churchId: args.churchId,
      })
      .catch((error: any) => console.error('Error aggregating Service', error))

    session.close()

    const serviceDetails = rearrangeCypherObject(cypherResponse)

    return serviceDetails.ministryAttendanceRecord.properties
  },
  RecordRehearsalMeeting: async (
    object: any,
    args: RecordServiceArgs,
    context: Context
  ) => {
    isAuth(permitLeaderAdmin('Hub'), context.jwt.roles)
    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()
    const sessionThree = context.executionContext.session()
    try {
      if (checkIfArrayHasRepeatingValues(args.treasurers)) {
        throw new Error(errorMessage.repeatingTreasurers)
      }

      await checkServantHasCurrentHistory(session, context, {
        churchId: args.churchId,
      })

      const promises = [
        session.executeRead((tx) =>
          tx.run(checkRehearsalFormFilledThisWeek, args)
        ),
        sessionTwo.executeRead((tx) => tx.run(getCurrency, args)),
        sessionThree.executeRead((tx) => tx.run(getHigherChurches, args)),
      ]

      const serviceCheckRes = await Promise.all(promises)

      const serviceCheck = rearrangeCypherObject(serviceCheckRes[0])

      const currencyCheck = rearrangeCypherObject(serviceCheckRes[1])

      if (
        serviceCheck.alreadyFilled &&
        ![''].some((label) => serviceCheck.labels?.includes(label))
      ) {
        throw new Error(errorMessage.no_double_form_filling)
      }

      if (serviceCheck.labels?.includes('Vacation')) {
        throw new Error(errorMessage.vacation_cannot_fill_service)
      }

      const aggregateCypher = ''

      const cypherResponse = await session
        .run(recordHubRehearsalService, {
          ...args,
          conversionRateToDollar: currencyCheck.conversionRateToDollar,
          jwt: context.jwt,
        })
        .catch((error: any) => throwToSentry('', error))

      const aggregatePromises = [
        sessionTwo.executeWrite((tx) =>
          tx.run(aggregateCypher, {
            churchId: args.churchId,
          })
        ),
      ]

      await Promise.all(aggregatePromises).catch((error: any) =>
        throwToSentry('Error Aggregating Hub Rehearsals', error)
      )

      const serviceDetails = rearrangeCypherObject(cypherResponse)

      return serviceDetails.rehearsalRecord.properties
    } catch (error) {
      throwToSentry('Error Recording hub rehearsal Service', error)
    } finally {
      await session.close()
      await sessionTwo.close()
      await sessionThree.close()
    }
    return null
  },

  RecordMinistryOnStageAttendance: async (
    object: any,
    args: RecordStageAttendanceArgs,
    context: Context
  ) => {
    isAuth(permitLeaderAdmin('Ministry'), context.jwt.roles)
    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()
    const sessionThree = context.executionContext.session()

    try {
      await checkServantHasCurrentHistory(session, context, {
        churchId: args.churchId,
      })

      const promises = [
        session.executeRead((tx) =>
          tx.run(checkMinistryStageAttendanceFormFilledThisWeek, args)
        ),
        sessionTwo.executeRead((tx) => tx.run(getHigherChurches, args)),
        sessionThree.executeRead((tx) => tx.run(checkStreamServiceDay, args)),
      ]

      const serviceCheckRes = await Promise.all(promises)

      const serviceCheck = rearrangeCypherObject(serviceCheckRes[0])

      const streamServiceDayCheck = rearrangeCypherObject(serviceCheckRes[2])

      if (!streamServiceDayCheck.serviceDay) {
        throw new Error(errorMessage.not_stream_service_day)
      }

      if (
        serviceCheck.alreadyFilled &&
        !['CreativeArts'].some((label) => serviceCheck.labels?.includes(label))
      ) {
        throw new Error(errorMessage.no_double_form_filling)
      }

      const aggregateCypher = ''

      const cypherResponse = await session
        .run(recordOnStageAttendance, {
          ...args,
          jwt: context.jwt,
        })
        .catch((error: any) =>
          throwToSentry('Error Recording OnStage Performance attendance', error)
        )

      const aggregatePromises = [
        sessionTwo.executeWrite((tx) =>
          tx.run(aggregateCypher, {
            churchId: args.churchId,
          })
        ),
      ]

      await Promise.all(aggregatePromises).catch((error: any) =>
        throwToSentry('Error Aggregating OnStage Performance', error)
      )

      const serviceDetails = cypherResponse.records[0].get(
        'stageAttendanceRecord'
      ).properties

      return serviceDetails
    } catch (error) {
      throwToSentry('Error recording OnStage attendance', error)
    } finally {
      await session.close()
      await sessionTwo.close()
      await sessionThree.close()
    }
    return null
  },

  RecordCancelledOnstagePerformance: async (
    object: any,
    args: RecordCancelledOnstageMinistryPerformanceArgs,
    context: Context
  ) => {
    isAuth(permitLeaderAdmin('Ministry'), context.jwt.roles)
    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()
    try {
      await checkServantHasCurrentHistory(session, context, {
        churchId: args.churchId,
      })

      const promises = [
        session.executeRead((tx) =>
          tx.run(checkMinistryStageAttendanceFormFilledThisWeek, args)
        ),
        sessionTwo.executeRead((tx) => tx.run(checkStreamServiceDay, args)),
      ]

      const serviceCheckRes = await Promise.all(promises)

      const serviceCheck = rearrangeCypherObject(serviceCheckRes[0])

      const streamServiceDayCheck = rearrangeCypherObject(serviceCheckRes[2])

      if (!streamServiceDayCheck.serviceDay) {
        throw new Error(errorMessage.not_stream_service_day)
      }

      if (
        serviceCheck.alreadyFilled &&
        !['CreativeArts'].some((label) => serviceCheck.labels?.includes(label))
      ) {
        throw new Error(errorMessage.no_double_form_filling)
      }

      const cypherResponse = await session
        .run(recordCancelledOnStagePerformance, {
          ...args,
          jwt: context.jwt,
        })
        .catch((error: any) =>
          throwToSentry(
            'Error Cancelling OnStage Performance attendance',
            error
          )
        )

      const serviceDetails = rearrangeCypherObject(cypherResponse)

      return serviceDetails.stagePerformanceRecord.properties
    } catch (error) {
      throwToSentry('Error cancelling OnStage performance', error)
    } finally {
      await session.close()
      await sessionTwo.close()
    }
    return null
  },
}

export default SontaServiceMutation
