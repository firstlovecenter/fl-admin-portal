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
import treasury from './treasury-cypher'

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

    // Form-defaulter precheck is a pure read with no write side, so the
    // read-then-throw pattern is safe (no race with the write below).
    const formDefaultersResponse = rearrangeCypherObject(
      await session
        .run(treasury.formDefaultersCount, args)
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

    // Removed the bankingDefaulersCount read-then-write precheck: two
    // tellers could both read non-zero and both fire confirmBanking. The
    // Cypher itself is now the source of truth — it returns affectedCount
    // and we throw "already banked" when zero records were updated.
    try {
      const response = await session.executeWrite((tx) =>
        tx.run(treasury.confirmBanking, {
          ...args,
          jwt: context.jwt,
          // bh_fromStatus is captured in-scope by the Cypher
          // (record.transactionStatus AS bh_fromStatus before the SET).
          bh_method: 'teller',
          bh_toStatus: 'teller-confirmed',
          bh_message: `Teller batch-confirmed banking for governorship ${args.governorshipId}`,
        })
      )
      const confirmationResponse = rearrangeCypherObject(response)

      if (
        !confirmationResponse?.governorship ||
        !confirmationResponse.affectedCount ||
        confirmationResponse.affectedCount.low === 0
      ) {
        throw new Error("This governorship's offering has already been banked!")
      }

      return {
        ...confirmationResponse.governorship.properties,
        banked: true,
      }
    } catch (error: any) {
      // Preserve the explicit "already banked" message — re-throw it raw
      // rather than wrapping it in "There was a problem…" so the user UI
      // can show the precise reason.
      if (
        typeof error?.message === 'string' &&
        error.message.includes('already been banked')
      ) {
        throw error
      }
      throw new Error(`There was a problem confirming the banking ${error}`)
    } finally {
      await session.close()
    }
  },
  ConfirmCouncilBanking: async (
    object: never,
    args: { councilId: string },
    context: Context
  ): Promise<any> => {
    isAuth(permitTellerStream(), context?.jwt?.roles)
    noEmptyArgsValidation([args.councilId])
    // Per-instance: teller must hold IS_TELLER_FOR on a Stream whose
    // reach covers this Council. Mirrors the ConfirmBanking IDOR fix.
    assertCan(context, permitTellerStream(), args.councilId)
    const session = context.executionContext.session()

    try {
      const response = await session.executeWrite((tx) =>
        tx.run(treasury.confirmCouncilBanking, {
          ...args,
          jwt: context.jwt,
          bh_method: 'teller',
          bh_toStatus: 'teller-confirmed',
          bh_message: `Teller batch-confirmed Council-level banking for council ${args.councilId}`,
        })
      )
      const confirmationResponse = rearrangeCypherObject(response)

      if (
        !confirmationResponse?.council ||
        !confirmationResponse.affectedCount ||
        confirmationResponse.affectedCount.low === 0
      ) {
        throw new Error("This council's offering has already been banked!")
      }

      return {
        ...confirmationResponse.council.properties,
        banked: true,
      }
    } catch (error: any) {
      if (
        typeof error?.message === 'string' &&
        error.message.includes('already been banked')
      ) {
        throw error
      }
      throw new Error(`There was a problem confirming the banking ${error}`)
    } finally {
      await session.close()
    }
  },
}

export default treasuryMutations
