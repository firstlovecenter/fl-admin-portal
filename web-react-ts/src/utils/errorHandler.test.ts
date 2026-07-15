import { describe, it, expect } from 'vitest'
import { ApolloError } from '@apollo/client'
import { getGraphQLErrorMessage } from './errorHandler'

describe('getGraphQLErrorMessage', () => {
  it('returns a fallback message for a falsy error', () => {
    expect(getGraphQLErrorMessage(null)).toBe('An unknown error occurred')
    expect(getGraphQLErrorMessage(undefined)).toBe('An unknown error occurred')
  })

  it('reads the message off an Error instance', () => {
    expect(getGraphQLErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('prefers a permission-related graphQLError on an ApolloError', () => {
    const error = new ApolloError({
      graphQLErrors: [
        { message: 'Validation failed' } as never,
        { message: 'Not permitted to do this' } as never,
      ],
    })
    expect(getGraphQLErrorMessage(error)).toBe('Not permitted to do this')
  })

  // SYN-205 — useMutation's `result.errors` under errorPolicy: 'all' are
  // plain GraphQLFormattedError objects, not Error/ApolloError instances.
  // UpdateMember.tsx wraps these in `new Error(...)` before calling
  // displayError, but this fallback exists for any other caller that passes
  // one through directly — without it, the branch below fell through to
  // `String(error)` → "[object Object]" in the toast.
  it('reads .message off a plain GraphQLFormattedError-shaped object', () => {
    expect(
      getGraphQLErrorMessage({
        message: 'This email already belongs to another member',
      })
    ).toBe('This email already belongs to another member')
  })

  it('does not treat a plain object without a string .message as having one', () => {
    expect(getGraphQLErrorMessage({ code: 'BAD_INPUT' })).toBe(
      '[object Object]'
    )
    expect(getGraphQLErrorMessage({ message: 42 })).toBe('[object Object]')
  })

  it('stringifies anything else', () => {
    expect(getGraphQLErrorMessage('a plain string error')).toBe(
      'a plain string error'
    )
  })
})
