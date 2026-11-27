/**
 * SYN-278 — `assertServiceDateInCurrentWeek` refusals must be user-input
 * errors (BAD_USER_INPUT), so errorReferencePlugin logs them at WARN instead
 * of stamping them INTERNAL_SERVER_ERROR and logging at ERROR.
 */
import { GraphQLError } from 'graphql'
import { assertServiceDateInCurrentWeek, toIsoDate } from './date-utils'
import { logLevelForCode } from './error-reference'

const errorMessage = require('../texts.json').error

const catchError = (serviceDate?: string): unknown => {
  try {
    assertServiceDateInCurrentWeek(serviceDate)
  } catch (error) {
    return error
  }
  throw new Error('expected assertServiceDateInCurrentWeek to throw')
}

describe('assertServiceDateInCurrentWeek', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // Mon 23 Nov 2026, 00:00:00.362 UTC — the moment the SYN-278 request
    // landed, right after the week rolled over.
    jest.setSystemTime(new Date('2026-11-23T00:00:00.362Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('accepts Monday of this week and today', () => {
    expect(() => assertServiceDateInCurrentWeek('2026-11-23')).not.toThrow()

    jest.setSystemTime(new Date('2026-11-29T23:59:59.000Z'))
    expect(() => assertServiceDateInCurrentWeek('2026-11-23')).not.toThrow()
    expect(() => assertServiceDateInCurrentWeek('2026-11-29')).not.toThrow()
  })

  it('refuses last Sunday once the week has rolled over, as BAD_USER_INPUT', () => {
    const error = catchError('2026-11-22')

    expect(error).toBeInstanceOf(GraphQLError)
    expect((error as GraphQLError).message).toBe(
      errorMessage.service_date_out_of_week
    )
    expect((error as GraphQLError).extensions.code).toBe('BAD_USER_INPUT')
    expect((error as GraphQLError).extensions.severity).toBe('USER_ERROR')
    expect(logLevelForCode((error as GraphQLError).extensions.code)).toBe(
      'warn'
    )
  })

  it('refuses a future date as BAD_USER_INPUT', () => {
    const error = catchError('2026-11-24') as GraphQLError

    expect(error).toBeInstanceOf(GraphQLError)
    expect(error.message).toBe(errorMessage.service_date_out_of_week)
    expect(error.extensions.code).toBe('BAD_USER_INPUT')
  })

  it.each([undefined, '', '23/11/2026', '2026-13-45'])(
    'refuses a missing or malformed date (%p) as BAD_USER_INPUT',
    (serviceDate) => {
      const error = catchError(serviceDate) as GraphQLError

      expect(error).toBeInstanceOf(GraphQLError)
      expect(error.message).toBe(errorMessage.service_date_required)
      expect(error.extensions.code).toBe('BAD_USER_INPUT')
    }
  )
})

describe('toIsoDate', () => {
  it('formats the UTC calendar date', () => {
    expect(toIsoDate(new Date('2026-11-23T00:00:00.362Z'))).toBe('2026-11-23')
  })
})
