// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { captureException } from '@sentry/node'
import { QueryResult } from 'neo4j-driver'
import { ChurchLevel, Member, neonumber, Role } from './types'

type ErrorCustom = {
  response: {
    data: {
      message: string
    }
    statusText: string
    status: string
  }
}

export const checkIfArrayHasRepeatingValues = (array: any[]) => {
  const sortedArray = array.sort()
  for (let i = 0; i < sortedArray.length - 1; i += 1) {
    if (sortedArray[i + 1] === sortedArray[i]) {
      return true
    }
  }
  return false
}

export const throwToSentry = (
  message: string,
  error: ErrorCustom | string | any
) => {
  let errorVar: string | ErrorCustom = ''

  if (error) {
    errorVar = error
  }

  if (error?.response?.statusText) {
    errorVar = `${error.response.status} ${error.response.statusText}`
  }

  if (error?.response?.data?.message) {
    errorVar = error?.response?.data?.message
  }

  if (error?.response?.data?.data) {
    errorVar = JSON.stringify(error?.response?.data?.data)
  }

  // eslint-disable-next-line no-console
  console.error(`${message} ${JSON.stringify(error)}`)
  console.log('🚀 ~ file: utils.ts:49 ~ errorVar:', errorVar)
  captureException(error, {
    tags: {
      message,
    },
  })
  throw new Error(`${message} ${errorVar}`)
}

export const noEmptyArgsValidation = (args: any[]) => {
  if (!args.length) {
    throwToSentry(
      'Argument not in Array',
      Error('Args must be passed in array')
    )
  }

  args.forEach((argument, index) => {
    if (!argument) {
      throwToSentry(
        'No Empty Arguments Allowed',
        Error(`${args[index - 1]} Argument Cannot Be Empty`)
      )
    }
  })
}

export const errorHandling = (member: Member) => {
  if (!member.email) {
    throw new Error(
      `${member.firstName} ${member.lastName} does not have a valid email address. Please add an email address and then try again`
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rearrangeCypherObject = (
  response: QueryResult,
  horizontal?: boolean
) => {
  const member: {
    [key: string]: any
  } = {}

  response.records[0]?.keys.forEach((value, index) => {
    // eslint-disable-next-line no-underscore-dangle
    member[value] = response.records[0]._fields[index]
  })

  response.records.forEach((record, index) => {
    record.keys.forEach((value, j) => {
      // eslint-disable-next-line no-underscore-dangle
      member[value] = response.records[index]._fields[j]
    })
  })

  if (horizontal) {
    const records: any[] = []
    response.records.forEach((record, index) => {
      const object: {
        [key: string]: any
      } = {}

      record?.keys.forEach((key, j) => {
        // eslint-disable-next-line no-underscore-dangle
        object[key] = response.records[index]._fields[j]
      })
      records.push(object)
    })

    return records
  }

  return member?.member || member
}

export const isAuth = (permittedRoles: Role[], userRoles?: Role[]) => {
  if (!permittedRoles.some((r) => userRoles?.includes(r))) {
    throw new Error('You are not permitted to run this mutation')
  }
}

export const nextHigherChurch = (churchLevel: ChurchLevel) => {
  switch (churchLevel) {
    case 'Fellowship':
      return 'Bacenta'
    case 'Bacenta':
      return 'Governorship'
    case 'Governorship':
      return 'Council'
    case 'Council':
      return 'Stream'
    case 'Stream':
      return 'Campus'
    case 'Campus':
      return 'Oversight'
    case 'Hub':
      return 'Ministry'
    case 'Ministry':
      return 'CreativeArts'
    case 'CreativeArts':
      return 'Campus'
    default:
      return 'Oversight'
  }
}

export const parseNeoNumber = (neoNumber: neonumber) => {
  if (!neoNumber) return 0

  if (neoNumber?.low) return neoNumber.low

  if (typeof neoNumber === 'number') return neoNumber

  return 0
}
