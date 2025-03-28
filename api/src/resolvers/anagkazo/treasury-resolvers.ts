/* eslint-disable no-underscore-dangle */
import {
  isAuth,
  noEmptyArgsValidation,
  rearrangeCypherObject,
  throwToSentry,
} from '../utils/utils'
import { MakeServant, RemoveServant } from '../directory/make-remove-servants'
import { permitAdmin, permitTellerStream } from '../permissions'
import { Context } from '../utils/neo4j-types'
import anagkazo from './treasury-cypher'

const treasuryMutations = {
  MakeStreamTeller: async (object: never, args: never, context: Context) =>
    MakeServant(context, args, [...permitAdmin('Stream')], 'Stream', 'Teller'),
  RemoveStreamTeller: async (object: never, args: never, context: Context) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Stream')],
      'Stream',
      'Teller'
    ),
  ConfirmBanking: async (
    object: never,
    args: { governorshipId: string },
    context: Context
  ): Promise<any> => {
    isAuth(
      permitTellerStream(),
      context?.jwt['https://flcadmin.netlify.app/roles']
    )
    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()
    noEmptyArgsValidation(['governorshipId'])

    // const today = new Date()
    // if (today.getDay() > 6) {
    //   throw new Error('You cannot receive offerings today! Thank you')
    // }

    //  implement checks to make sure that all the fellowships have filled their offering

    const formDefaultersResponse = rearrangeCypherObject(
      await session
        .run(anagkazo.formDefaultersCount, args)
        .catch((error: any) =>
          throwToSentry('There was an error running cypher', error)
        )
    )

    // const checks = await Promise.all([
    //   session.executeRead((tx) =>
    //     tx.run(anagkazo.membershipAttendanceDefaultersCount, args)
    //   ),
    //   sessionTwo.executeRead((tx) =>
    //     tx.run(anagkazo.imclDefaultersCount, args)
    //   ),
    // ])

    // const membershipAttendanceDefaultersCount = parseNeoNumber(
    //   checks[0].records[0]?.get('defaulters')
    // )
    // const membershipAttendanceDefaultersList =
    //   checks[0].records[0]?.get('defaultersNames')

    // const imclDefaultersCount = parseNeoNumber(
    //   checks[1].records[0]?.get('defaulters')
    // )
    // const imcleDefaultersList = checks[1].records[0]?.get('defaultersNames')

    const formDefaultersCount = formDefaultersResponse.defaulters.low
    const formDefaultersList = formDefaultersResponse.defaultersNames

    if (formDefaultersCount > 0) {
      throw new Error(
        `You cannot confirm this governorship until all the active fellowships have filled their forms. Outstanding fellowships are: ${formDefaultersList.join(
          ', '
        )}`
      )
    }

    // if (membershipAttendanceDefaultersCount > 0) {
    //   throw new Error(
    //     `You cannot confirm this governorship until all the active fellowships have marked their attendance on the Poimen App. Outstanding fellowships are: ${membershipAttendanceDefaultersList.join(
    //       ', '
    //     )}`
    //   )
    // }

    // if (imclDefaultersCount > 0) {
    //   throw new Error(
    //     `You cannot confirm this governorship until all the active fellowships have filled their IMCL forms on the Poimen App. Oustanding fellowships are: ${imcleDefaultersList.join(
    //       ', '
    //     )}`
    //   )
    // }

    const checkAlreadyConfirmedResponse = rearrangeCypherObject(
      await session
        .run(anagkazo.bankingDefaulersCount, args)
        .catch((error: any) =>
          throwToSentry('There was an error running cypher', error)
        )
    )

    const checkAlreadyConfirmed =
      checkAlreadyConfirmedResponse.bankingDefaulters.low

    if (checkAlreadyConfirmed < 1) {
      throw new Error("This governorship's offering has already been banked!")
    }

    try {
      const response = await session.executeWrite((tx) =>
        tx.run(anagkazo.confirmBanking, {
          ...args,
          jwt: context.jwt,
        })
      )
      const confirmationResponse = rearrangeCypherObject(response)

      if (typeof confirmationResponse === 'string') {
        return confirmationResponse
      }

      // return confirmationResponse.governorship.properties
      return {
        ...confirmationResponse.governorship.properties,
        banked: true,
      }
    } catch (error: any) {
      throw new Error(`There was a problem confirming the banking ${error}`)
    } finally {
      await Promise.all([session.close(), sessionTwo.close()])
    }
  },
}

export default treasuryMutations
