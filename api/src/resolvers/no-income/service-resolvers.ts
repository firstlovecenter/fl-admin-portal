import { isAuth, rearrangeCypherObject } from '../utils/utils'
import {
  checkCurrentServiceLog,
  checkFormFilledThisWeek,
  getServantAndChurch as getServantAndChurchCypher,
} from '../services/service-cypher'
import { Context } from '../utils/neo4j-types'
import { Member } from '../utils/types'
import { permitLeaderAdmin } from '../permissions'
import { makeServantCypher } from '../directory/utils'
import recordService from './service-cypher'

const errorMessage = require('../texts.json').error

const serviceNoIncomeMutations = {
  RecordServiceNoIncome: async (
    object: any,
    args: Member,
    context: Context
  ) => {
    isAuth(permitLeaderAdmin('Fellowship'), context.jwt.roles)
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
          auth_id: getServantAndChurch.auth_id,
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

    const serviceDetails = rearrangeCypherObject(
      await session.executeWrite((tx) =>
        tx.run(recordService, {
          ...args,
          jwt: context.jwt,
        })
      )
    )

    return serviceDetails.serviceRecord.properties
  },
}

export default serviceNoIncomeMutations
