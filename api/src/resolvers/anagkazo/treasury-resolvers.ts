/* eslint-disable no-underscore-dangle */
import {
  isAuth,
  noEmptyArgsValidation,
  rearrangeCypherObject,
  throwToSentry,
} from '../utils/utils'
import { MakeServant, RemoveServant } from '../directory/make-remove-servants'
import { permitAdmin, permitTellerStream } from '../permissions'
import { assertCan } from '../utils/assert-can'
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
    isAuth(permitTellerStream(), context?.jwt?.roles)
    noEmptyArgsValidation([args.governorshipId])
    // Per-instance check: the caller's `tellerStream` role must bind to a
    // Stream whose reach includes this governorship. Without it any teller
    // could confirm any governorship's banking (real money — IDOR class
    // defect).
    assertCan(context, permitTellerStream(), args.governorshipId)
    const session = context.executionContext.session()

    // const today = new Date()
    // if (today.getDay() > 6) {
    //   throw new Error('You cannot receive offerings today! Thank you')
    // }

    //  implement checks to make sure that all the bacentas have filled their offering

    const formDefaultersResponse = rearrangeCypherObject(
      await session
        .run(anagkazo.formDefaultersCount, args)
        .catch((error: any) =>
          throwToSentry('There was an error running cypher', error)
        )
    )

    const formDefaultersCount = formDefaultersResponse.defaulters.low
    const formDefaultersList = formDefaultersResponse.defaultersNames

    if (formDefaultersCount > 0) {
      throw new Error(
        `You cannot confirm this governorship until all the active bacentas have filled their forms. Outstanding bacentas are: ${formDefaultersList.join(
          ', '
        )}`
      )
    }

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
      await session.close()
    }
  },
}

export default treasuryMutations
