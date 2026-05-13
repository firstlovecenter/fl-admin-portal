import { GraphQLError } from 'graphql'
import { isAuth, throwToSentry } from './utils'
import type { Role } from './types'

// Mirrors the shape index.js produces: jwt ? { ...jwt, allowedChurchIds } : {}
const makeJwt = (roles: Role[] | undefined): { roles?: Role[] } => ({ roles })

// ---------------------------------------------------------------------------
// isAuth
// ---------------------------------------------------------------------------
describe('isAuth', () => {
  describe('allow path', () => {
    it('returns void when the user holds one of the permitted roles', () => {
      expect(() =>
        isAuth(['leaderBacenta', 'adminGovernorship'], ['leaderBacenta'])
      ).not.toThrow()
    })

    it('returns void when the user holds multiple roles and one matches', () => {
      expect(() =>
        isAuth(['adminDenomination'], ['leaderBacenta', 'adminDenomination'])
      ).not.toThrow()
    })

    // Callers do not check the return value — pin that it stays void so a
    // refactor cannot accidentally return a truthy sentinel.
    it('returns undefined on success', () => {
      expect(isAuth(['leaderBacenta'], ['leaderBacenta'])).toBeUndefined()
    })
  })

  describe('deny path', () => {
    it('throws a GraphQLError when user roles are disjoint from permitted', () => {
      expect(() =>
        isAuth(['adminDenomination'], ['leaderBacenta'])
      ).toThrow(GraphQLError)
    })

    it('thrown error carries extensions.code === "FORBIDDEN"', () => {
      let caught: unknown
      try {
        isAuth(['adminDenomination'], ['leaderBacenta'])
      } catch (err) {
        caught = err
      }
      expect(caught).toBeInstanceOf(GraphQLError)
      expect((caught as GraphQLError).extensions.code).toBe('FORBIDDEN')
    })

    it('thrown error carries extensions.severity === "USER_ERROR"', () => {
      let caught: unknown
      try {
        isAuth(['adminDenomination'], ['leaderBacenta'])
      } catch (err) {
        caught = err
      }
      expect((caught as GraphQLError).extensions.severity).toBe('USER_ERROR')
    })
  })

  describe('edge cases — falsy/empty userRoles must never pass silently', () => {
    it('throws when userRoles is undefined', () => {
      expect(() => isAuth(['leaderBacenta'], undefined)).toThrow(GraphQLError)
    })

    it('throws when userRoles is an empty array', () => {
      expect(() => isAuth(['leaderBacenta'], [])).toThrow(GraphQLError)
    })
  })

  describe('trust boundary — context.jwt.roles is the only source of truth', () => {
    // The resolver convention is: isAuth(permit*(level), context.jwt.roles).
    // Anything the client supplies via args is never forwarded as the second
    // argument. This test pins that calling with context.jwt.roles (which
    // lacks the required role) still denies, regardless of what the client
    // might claim in args.
    it('denies when context.jwt.roles lacks the required role, regardless of what a client might supply', () => {
      const contextJwt = makeJwt(['leaderBacenta']) // real JWT: only Bacenta leader
      // Client could claim adminDenomination in args — but isAuth never sees args.roles
      expect(() =>
        isAuth(['adminDenomination'], contextJwt.roles)
      ).toThrow(GraphQLError)
    })

    it('allows when context.jwt.roles contains the required role', () => {
      const contextJwt = makeJwt(['adminDenomination'])
      expect(() =>
        isAuth(['adminDenomination'], contextJwt.roles)
      ).not.toThrow()
    })
  })

  describe('resolver guard — removing the isAuth call causes these tests to fail', () => {
    // Minimal stub that mirrors every custom resolver body:
    //   isAuth(permit*(level), context.jwt.roles)   ← first line, always
    //   return data
    const guardedResolver = (
      context: { jwt: { roles?: Role[] } }
    ): string => {
      isAuth(['leaderBacenta', 'leaderGovernorship'], context.jwt.roles)
      return 'ok'
    }

    it('throws FORBIDDEN when the caller holds an insufficient role', () => {
      expect(() =>
        guardedResolver({ jwt: { roles: ['arrivalsCounterStream'] } })
      ).toThrow(GraphQLError)
    })

    // Expired / unsigned tokens → verifyJwt returns null → index.js sets
    // context.jwt = {}.  context.jwt.roles is therefore undefined and must
    // not pass the gate silently.
    it('throws FORBIDDEN when jwt is empty (models an expired or unsigned token)', () => {
      expect(() => guardedResolver({ jwt: {} })).toThrow(GraphQLError)
    })

    it('allows through when the caller holds the correct role', () => {
      expect(
        guardedResolver({ jwt: { roles: ['leaderBacenta'] } })
      ).toBe('ok')
    })
  })
})

// ---------------------------------------------------------------------------
// throwToSentry
// ---------------------------------------------------------------------------
describe('throwToSentry', () => {
  it('throws an Error containing both the message and the error summary', () => {
    expect(() =>
      throwToSentry('Something failed', new Error('db timeout'))
    ).toThrow('Something failed: db timeout')
  })

  it('logs the formatted string to console.error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      throwToSentry('Oops', new Error('boom'))
    } catch {
      // expected
    }
    expect(spy).toHaveBeenCalledWith('Oops: boom')
    spy.mockRestore()
  })

  it('handles a plain string error', () => {
    expect(() =>
      throwToSentry('Context', 'raw string error')
    ).toThrow('Context: raw string error')
  })

  it('extracts the upstream message from an axios-style error', () => {
    const axiosError = {
      response: {
        data: { message: 'Upstream gone' },
        statusText: 'Bad Gateway',
        status: '502',
      },
    }
    expect(() =>
      throwToSentry('Upstream failed', axiosError)
    ).toThrow('Upstream failed: Upstream gone')
  })

  it('falls back to the HTTP status line when data.message is absent', () => {
    const axiosError = {
      response: { data: {}, statusText: 'Bad Gateway', status: '502' },
    }
    expect(() =>
      throwToSentry('Upstream failed', axiosError)
    ).toThrow('Upstream failed: 502 Bad Gateway')
  })

  it('handles an unknown error shape without throwing itself', () => {
    expect(() =>
      throwToSentry('Unknown', 42 as unknown as Error)
    ).toThrow('Unknown: Unknown error of type number')
  })

  it('handles null/undefined gracefully', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => throwToSentry('Empty', null)).toThrow('Empty: ')
    expect(() => throwToSentry('Empty', undefined)).toThrow('Empty: ')
    spy.mockRestore()
  })
})
