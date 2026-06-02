// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { GraphQLError } from 'graphql'
import { QueryResult } from 'neo4j-driver'
import { ChurchLevel, Member, neonumber, Role } from './types'

// `GraphQLError` (not a plain Error with `error.extensions` set) is required so
// Apollo Server 4's default formatError preserves `extensions.code` once
// NODE_ENV=production — without this the FE always sees INTERNAL_SERVER_ERROR.
export const badRequest = (message: string): GraphQLError =>
  new GraphQLError(message, {
    extensions: { code: 'BAD_USER_INPUT', severity: 'USER_ERROR' },
  })

export const isClassifiedError = (err: unknown): boolean => {
  const code = (err as { extensions?: { code?: string } })?.extensions?.code
  return code === 'BAD_USER_INPUT' || code === 'FORBIDDEN'
}

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

// SYN-103 — produce a short, audit-safe summary of an error for the
// log line and the rethrown message. The previous implementation did
// `JSON.stringify(error)` which serialised Neo4j driver internals,
// axios headers (Authorization tokens included), full stack frames, and
// any `.cause` chain into CloudWatch. The new shape extracts only the
// message text per known error type and drops everything else. Notably
// no more `JSON.stringify(error?.response?.data?.data)` — which on a
// Paystack error happily logged full webhook payloads.
const summariseError = (error: unknown): string => {
  if (!error) return ''
  if (typeof error === 'string') return error
  // Axios-style HTTP error from upstream services (Paystack, mNotify,
  // etc). Prefer the upstream's user-facing message; fall back to the
  // status line.
  const axiosLike = error as ErrorCustom
  if (axiosLike?.response?.data?.message) {
    return axiosLike.response.data.message
  }
  if (axiosLike?.response?.statusText) {
    return `${axiosLike.response.status} ${axiosLike.response.statusText}`
  }
  // Neo4j driver / generic Error — use the message only. Stack frames,
  // .cause, .errors arrays, and bound parameters stay out of the log.
  if (error instanceof Error) return error.message
  // Unknown shape — record the type, not the contents.
  return `Unknown error of type ${typeof error}`
}

export const throwToSentry = (
  message: string,
  error: ErrorCustom | string | any
) => {
  const errorSummary = summariseError(error)
  // eslint-disable-next-line no-console
  console.error(`${message}: ${errorSummary}`)
  throw new Error(`${message}: ${errorSummary}`)
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

// SYN-104 — quiet path. The previous implementation logged the full
// permittedRoles + userRoles arrays on failure, which leaks the role
// enum shape to anyone with CloudWatch read, and emitted a noisy
// per-call success log. Both are dropped. The classified FORBIDDEN
// error still surfaces to Apollo, the FE shows the same message, and
// throwToSentry-flavoured traces still capture nothing role-shaped.
export const isAuth = (permittedRoles: Role[], userRoles?: Role[]) => {
  if (!permittedRoles.some((r) => userRoles?.includes(r))) {
    throw new GraphQLError('You are not permitted to run this mutation', {
      extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' },
    })
  }
}

export const nextHigherChurch = (churchLevel: ChurchLevel) => {
  switch (churchLevel) {
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
