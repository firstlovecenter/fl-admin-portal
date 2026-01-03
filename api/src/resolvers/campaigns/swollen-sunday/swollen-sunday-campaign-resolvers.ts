import { permitAdmin } from '../../permissions'
import { Context } from '../../utils/neo4j-types'
import { isAuth, rearrangeCypherObject, throwToSentry } from '../../utils/utils'
import {
  aggregateTargetsCypher,
  getCouncilAverage,
  shareBacentaTargetsCypher,
  uploadBacentaTargetsCypher,
} from './swollen-sunday-campaign-cypher'

type TargetArg = {
  councilId: string
  target: number
}

type TargetFields = {
  governorship: string
  bacenta: string
  target: number
  code: number
  leader: string
}

const convertToNumber = (key: any, value: any) => {
  if (typeof value.target === 'string') {
    return { councilId: value.councilId, target: parseInt(value.target, 10) }
  }
  return value
}

const runShareBacenta = async (
  councilId: string,
  target: number | string,
  swellDate: string,
  context: Context
) => {
  try {
    const session = context.executionContext.session()

    const averageCouncilBussing = rearrangeCypherObject(
      await session.run(getCouncilAverage, {
        councilId,
      })
    )

    const response = rearrangeCypherObject(
      await session.run(shareBacentaTargetsCypher, {
        councilId,
        averageCouncilBussing: averageCouncilBussing.averageCouncilBussing,
        swellDate,
        target,
      })
    )

    return response.target?.properties
  } catch (error) {
    return throwToSentry(
      'There was an error setting the bacenta targets',
      error
    )
  }
}

const UploadBacentaTargets = async (
  object: never,
  args: { data: string; swellDate: string },
  context: Context
) => {
  isAuth(
    permitAdmin('Council'),
    context.jwt['https://flcadmin.netlify.app/roles']
  )
  const session = context.executionContext.session()

  const jsonData: [] = JSON.parse(args.data)

  jsonData.every((item: TargetFields) => {
    if (
      item.governorship === '' ||
      item.bacenta === '' ||
      item.code === null ||
      item.leader === '' ||
      item.target === null
    ) {
      throw new Error('No field must be left empty')
    }

    if (
      !(
        'hasOwnProperty' in item &&
        'bacenta' in item &&
        'code' in item &&
        'leader' in item &&
        'target' in item
      )
    ) {
      throw new Error('Every field has to have a value!')
    }

    return true
  })

  try {
    const response = rearrangeCypherObject(
      await session.run(uploadBacentaTargetsCypher, {
        data: JSON.parse(args.data),
        swellDate: args.swellDate,
      })
    )

    await session.run(aggregateTargetsCypher, {
      swellDate: args.swellDate,
    })

    if (response.result) {
      return 'Targets uploaded successfully'
    }
    return throwToSentry(
      'There was an error uploading the bacenta taregts',
      response
    )
  } catch (error) {
    return throwToSentry(
      'There was an error uploading the bacenta taregts',
      error
    )
  }
}

const ShareBacentaTargets = async (
  object: never,
  args: { data: string; swellDate: string },
  context: Context
) => {
  isAuth(
    permitAdmin('Council'),
    context.jwt['https://flcadmin.netlify.app/roles']
  )
  const session = context.executionContext.session()

  const parsedTargets: TargetArg[] = JSON.parse(args.data, convertToNumber)

  await Promise.all(
    Object.entries(parsedTargets).map(([, targetArgs]) =>
      runShareBacenta(
        targetArgs.councilId,
        targetArgs.target,
        args.swellDate,
        context
      )
    )
  )

  await session.run(aggregateTargetsCypher, {
    swellDate: args.swellDate,
  })

  return true
}
const swollenSundayMutations = {
  UploadBacentaTargets: async (
    object: never,
    args: { data: string; swellDate: string },
    context: Context
  ) => UploadBacentaTargets(object, args, context),
  ShareTargetsByCouncil: async (
    object: never,
    args: { data: string; swellDate: string },
    context: Context
  ) => ShareBacentaTargets(object, args, context),
}
export default swollenSundayMutations
