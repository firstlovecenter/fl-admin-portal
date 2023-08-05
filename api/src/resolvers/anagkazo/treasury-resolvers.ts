/* eslint-disable no-underscore-dangle */
import {
  isAuth,
  noEmptyArgsValidation,
  parseNeoNumber,
  rearrangeCypherObject,
  throwToSentry,
} from '../utils/utils'
import { MakeServant, RemoveServant } from '../directory/make-remove-servants'
import { permitTeller, permitAdmin } from '../permissions'
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
    args: { constituencyId: string },
    context: Context
  ): Promise<any> => {
    isAuth(permitTeller(), context?.auth.roles)
    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()
    noEmptyArgsValidation(['constituencyId'])

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

    const checks = await Promise.all([
      session.executeRead((tx) =>
        tx.run(anagkazo.membershipAttendanceDefaultersCount, args)
      ),
      sessionTwo.executeRead((tx) =>
        tx.run(anagkazo.imclDefaultersCount, args)
      ),
    ])

    const membershipAttendanceDefaultersCount = parseNeoNumber(
      checks[0].records[0]?.get('defaulters')
    )
    const imclDefaultersCount = parseNeoNumber(
      checks[1].records[0]?.get('defaulters')
    )

    const formDefaultersCount = formDefaultersResponse.defaulters.low

    if (formDefaultersCount > 0) {
      throw new Error(
        'You cannot confirm this constituency until all the active fellowships have filled their forms'
      )
    }

    if (membershipAttendanceDefaultersCount > 0) {
      throw new Error(
        'You cannot confirm this constituency until all the active fellowships have marked their attendance on the Poimen App'
      )
    }

    if (imclDefaultersCount > 0) {
      throw new Error(
        'You cannot confirm this constituency until all the active fellowships have filled their IMCL forms on the Poimen App'
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
      throw new Error("This constituency's offering has already been banked!")
    }

    try {
      const response = await session.executeWrite((tx) =>
        tx.run(anagkazo.confirmBanking, {
          ...args,
          auth: context.auth,
        })
      )
      const confirmationResponse = rearrangeCypherObject(response)

      if (typeof confirmationResponse === 'string') {
        return confirmationResponse
      }

      // return confirmationResponse.constituency.properties
      return {
        ...confirmationResponse.constituency.properties,
        banked: true,
      }
    } catch (error: any) {
      throwToSentry('There was a problem confirming the banking', error || '')
    }
    await Promise.all([session.close(), sessionTwo.close()])
    return 'Confirmation Successful'
  },
}

export default treasuryMutations
