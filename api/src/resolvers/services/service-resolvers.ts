import { Session } from 'neo4j-driver'
import { makeServantCypher } from '../directory/utils'
import { permitLeaderAdmin } from '../permissions'
import { Context } from '../utils/neo4j-types'
import {
  checkIfArrayHasRepeatingValues,
  isAuth,
  rearrangeCypherObject,
  throwToSentry,
} from '../utils/utils'
import { assertChurchScope } from '../utils/scope-utils'
import {
  assertPositiveFiniteAmount,
  MAX_OFFERING_CASH,
} from '../utils/financial-utils'
import {
  absorbAllTransactions,
  checkCurrentServiceLog,
  checkFormFilledThisWeek,
  getCurrency,
  getServantAndChurch as getServantAndChurchCypher,
  recomputeAggregateChainAfterServiceRecord,
  recordCancelledService,
  recordService,
  getHigherChurches,
  recordSpecialService,
} from './service-cypher'

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

type RecordCancelledServiceArgs = {
  churchId: string
  serviceDate: string
  noServiceReason: string
}

export const checkServantHasCurrentHistory = async (
  session: Session,
  context: Context,
  args: { churchId: string }
) => {
  const relationshipCheck = await session.executeRead((tx) =>
    tx.run(checkCurrentServiceLog, { churchId: args.churchId })
  )

  const relationExists = relationshipCheck.records[0]?.get('exists')

  if (!relationExists) {
    // Checks if the church has a current history record otherwise creates it
    const getServantAndChurch = await session.executeRead((tx) =>
      tx.run(getServantAndChurchCypher, { churchId: args.churchId })
    )

    const servantAndChurch = {
      churchId: getServantAndChurch.records[0]?.get('churchId'),
      churchName: getServantAndChurch.records[0]?.get('churchName'),
      churchType: getServantAndChurch.records[0]?.get('churchType'),
      servantId: getServantAndChurch.records[0]?.get('servantId'),

      firstName: getServantAndChurch.records[0]?.get('firstName'),
      lastName: getServantAndChurch.records[0]?.get('lastName'),
    }

    if (Object.keys(servantAndChurch).length === 0) {
      throw new Error(
        'You must set a leader over this church before you can fill this form'
      )
    }

    await makeServantCypher({
      context,
      churchType: servantAndChurch.churchType,
      servantType: 'Leader',
      servant: {
        id: servantAndChurch.servantId,

        firstName: servantAndChurch.firstName,
        lastName: servantAndChurch.lastName,
      },
      args: {
        leaderId: servantAndChurch.servantId,
      },
      church: {
        id: servantAndChurch.churchId,
        name: servantAndChurch.churchName,
      },
    })
  }
}

// Service-recording auth contract (SYN-125).
//
// `permitLeaderAdmin('Bacenta')` — NOT `permitLeader('Bacenta')` — is the
// intended gate for every service-recording mutation in this file
// (RecordService / RecordSpecialService / RecordCancelledService).
//
// The set is the union returned by `permitLeader('Bacenta')` +
// `permitAdmin('Bacenta')` in `api/src/resolvers/permissions.ts`:
//   - Leaders: leaderBacenta, leaderGovernorship, leaderCouncil,
//     leaderStream, leaderCampus, leaderOversight, leaderDenomination
//   - Admins:  adminGovernorship, adminCouncil, adminStream, adminCampus,
//     adminOversight, adminDenomination (no `adminBacenta` exists)
//
// The admin half is the deliberate part: church admins at Governorship and
// above can record on a Bacenta's behalf when the leader is absent or stuck.
// Same gate is used by `BankServiceOffering` (banking-resolver.ts:127) and
// is the contract documented in `kb/02-user-roles.md` "What each role can do"
// and `kb/03-workflows.md` W1 step 3. `permitLeader('Bacenta')` is
// intentionally never used here; tightening would break the admin override.
// Keep FE/BE permission helpers in sync (ADR-001).
const serviceMutation = {
  RecordService: async (
    object: any,
    args: RecordServiceArgs,
    context: Context
  ) => {
    isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)
    assertPositiveFiniteAmount(args.income, 'income', {
      max: MAX_OFFERING_CASH,
    })
    await assertChurchScope(context, args.churchId)
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
        session.executeRead((tx) => tx.run(checkFormFilledThisWeek, args)),
        sessionTwo.executeRead((tx) => tx.run(getCurrency, args)),
        sessionThree.executeRead((tx) => tx.run(getHigherChurches, args)),
      ]

      const serviceCheckRes = await Promise.all(promises)

      const serviceCheck = rearrangeCypherObject(serviceCheckRes[0])
      const currencyCheck = rearrangeCypherObject(serviceCheckRes[1])

      if (
        serviceCheck.alreadyFilled &&
        !['Oversight', 'Denomination'].some((label) =>
          serviceCheck.labels?.includes(label)
        )
      ) {
        throw new Error(errorMessage.no_double_form_filling)
      }
      if (serviceCheck.labels?.includes('Vacation')) {
        throw new Error(errorMessage.vacation_cannot_fill_service)
      }

      // All four writes (record + absorb + leaf-recompute + parent-recompute)
      // run in a single transaction so a failure mid-flow rolls everything
      // back. ADR-005 idempotency for money-bearing flows.
      const cypherResponse = await session
        .executeWrite(async (tx) => {
          const createRes = await tx.run(recordService, {
            ...args,
            conversionRateToDollar: currencyCheck.conversionRateToDollar,
            jwt: context.jwt,
          })

          if (!createRes.records || createRes.records.length === 0) {
            throw new Error(
              'Service record could not be created. Please ensure the church is a Bacenta, Governorship, Council, or Stream.'
            )
          }

          const serviceRecordId =
            createRes.records[0].get('serviceRecord').properties.id

          await tx.run(absorbAllTransactions, {
            ...args,
            conversionRateToDollar: currencyCheck.conversionRateToDollar,
            serviceRecordId,
          })

          // Sync recompute: ONLY the immediate parent of the submitting
          // church (Bacenta→Gov, Gov→Council, Council→Stream, Stream→Campus).
          // Each subquery is gated on the exact submitting label and is a
          // no-op otherwise. The lambda remains the primary writer for
          // general aggregation — this exists purely so the parent
          // dashboard updates live without waiting for the next lambda run.
          await tx.run(recomputeAggregateChainAfterServiceRecord, {
            churchId: args.churchId,
            serviceRecordId,
          })

          return createRes
        })
        .catch((error: any) => throwToSentry('Error Recording Service', error))

      const serviceDetails = rearrangeCypherObject(cypherResponse)

      return serviceDetails.serviceRecord.properties
    } catch (error) {
      throwToSentry('Error Recording Service', error)
    } finally {
      await session.close()
      await sessionTwo.close()
      await sessionThree.close()
    }

    return null
  },
  RecordSpecialService: async (
    object: any,
    args: RecordServiceArgs,
    context: Context
  ) => {
    isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)
    await assertChurchScope(context, args.churchId)
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
        sessionTwo.executeRead((tx) => tx.run(getCurrency, args)),
        sessionThree.executeRead((tx) => tx.run(getHigherChurches, args)),
      ]

      const serviceCheckRes = await Promise.all(promises)

      const currencyCheck = rearrangeCypherObject(serviceCheckRes[0])

      if (currencyCheck.labels?.includes('Vacation')) {
        throw new Error(errorMessage.vacation_cannot_fill_service)
      }

      const cypherResponse = await session
        .executeWrite(async (tx) => {
          const createRes = await tx.run(recordSpecialService, {
            ...args,
            conversionRateToDollar: currencyCheck.conversionRateToDollar,
            jwt: context.jwt,
          })

          if (!createRes.records || createRes.records.length === 0) {
            throw new Error(
              'Special service record could not be created. Please ensure the church is a Bacenta, Governorship, Council, or Stream.'
            )
          }

          const serviceRecordId =
            createRes.records[0].get('serviceRecord').properties.id

          await tx.run(absorbAllTransactions, {
            ...args,
            conversionRateToDollar: currencyCheck.conversionRateToDollar,
            serviceRecordId,
          })

          await tx.run(recomputeAggregateChainAfterServiceRecord, {
            churchId: args.churchId,
            serviceRecordId,
          })

          return createRes
        })
        .catch((error: any) => throwToSentry('Error Recording Service', error))

      const serviceDetails = rearrangeCypherObject(cypherResponse)

      return serviceDetails.serviceRecord.properties
    } catch (error) {
      throwToSentry('Error Recording Service', error)
    } finally {
      await session.close()
      await sessionTwo.close()
      await sessionThree.close()
    }

    return null
  },
  RecordCancelledService: async (
    object: any,
    args: RecordCancelledServiceArgs,
    context: Context
  ) => {
    isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)
    await assertChurchScope(context, args.churchId)
    const session = context.executionContext.session()

    const relationshipCheck = rearrangeCypherObject(
      await session.executeRead((tx) => tx.run(checkCurrentServiceLog, args))
    )

    if (!relationshipCheck.exists) {
      // Checks if the church has a current history record otherwise creates it
      const getServantAndChurch = rearrangeCypherObject(
        await session.executeRead((tx) =>
          tx.run(getServantAndChurchCypher, args)
        )
      )

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

    const serviceCheck = rearrangeCypherObject(
      await session.executeRead((tx) => tx.run(checkFormFilledThisWeek, args))
    )

    if (serviceCheck.alreadyFilled) {
      throw new Error(errorMessage.no_double_form_filling)
    }
    if (serviceCheck.labels?.includes('Vacation')) {
      throw new Error(errorMessage.vacation_cannot_fill_service)
    }

    const cypherResponse = await session.executeWrite((tx) =>
      tx.run(recordCancelledService, {
        ...args,
        jwt: context.jwt,
      })
    )

    await session.close()

    const serviceDetails = rearrangeCypherObject(cypherResponse)

    return serviceDetails.serviceRecord.properties
  },
}

export default serviceMutation
