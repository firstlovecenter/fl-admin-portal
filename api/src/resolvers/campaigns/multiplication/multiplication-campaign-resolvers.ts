import { permitLeaderAdmin } from '../../permissions'
import { checkServantHasCurrentHistory } from '../../services/service-resolvers'
import { Context } from '../../utils/neo4j-types'
import {
  checkIfArrayHasRepeatingValues,
  isAuth,
  rearrangeCypherObject,
  throwToSentry,
} from '../../utils/utils'
import {
  aggregateMultiplicationDataOnHigherChurches,
  recordMultiplicationEvent,
} from './multiplication-campaign-cypher'

const errorMessage = require('../../texts.json').error

type RecordMultiplicationEventArgs = {
  treasurers: string[]
  churchId: string
  preacherId: string
  crusadeLocation: string
  attendance: number
  income: number
  foreignCurrency: string
  souls: number
  miracles: number
  crusadePictures: string[]
  treasurerSelfie: string
  crusadeDate: Date
}

const multiplicationCampaignMutations = {
  RecordMultiplicationEvent: async (
    object: never,
    args: RecordMultiplicationEventArgs,
    context: Context
  ) => {
    isAuth(
      permitLeaderAdmin('Governorship'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )
    const session = context.executionContext.session()

    if (checkIfArrayHasRepeatingValues(args.treasurers)) {
      throw new Error(errorMessage.repeatingTreasurers)
    }

    await checkServantHasCurrentHistory(session, context, {
      churchId: args.churchId,
    })

    const secondSession = context.executionContext.session()
    const cypherResponse = await Promise.all([
      session.run(recordMultiplicationEvent, {
        ...args,
        auth: context.auth,
      }),
      secondSession.run(aggregateMultiplicationDataOnHigherChurches, {
        ...args,
      }),
    ]).catch((error) => throwToSentry('Error Recording Service', error))

    const multiplicationRecord = rearrangeCypherObject(cypherResponse[0])

    return multiplicationRecord.record.properties
  },
}

export default multiplicationCampaignMutations
