/**
 * AuthContext.test.tsx — SYN-65, updated for SYN-173
 *
 * Characterization + unit tests for:
 *   - AuthProvider (initial state, login, logout, refresh, reverify)
 *   - isTokenExpired (pure function from lib/auth-service)
 *
 * SYN-173 storage model (asserted throughout):
 *   - The access token lives in a module-scoped variable (memory), NEVER in
 *     localStorage/sessionStorage. A reload starts with no token, so mount
 *     always bootstraps one from the httpOnly refresh cookie via
 *     POST /auth/refresh-token (the cookie itself is invisible to JS and to
 *     jsdom — MSW just answers the request).
 *   - The refresh token is never read or written by JS at all; there is no
 *     `fl_refresh_token` key anymore.
 *   - Only the non-credential `fl_user` profile is persisted (cross-tab signal
 *     + first paint).
 *
 * Out of scope (documented):
 *   - Proactive silent-refresh setTimeout scheduling — requires complex fake-timer
 *     wrangling for minimal value; the scheduler itself delegates to refreshAccessToken
 *     which is tested here.
 *   - Cross-tab storage event / window.location.reload — jsdom does not support
 *     cross-tab events and mocking location.reload adds noise without value.
 *   - signup / resetPassword / setupPassword handlers — they follow the same
 *     pattern as login; covered if login is covered.
 */

import React from 'react'
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

import { AuthProvider, useAuth } from 'contexts/AuthContext'
import {
  isTokenExpired,
  getRolesFromToken,
  isLegacyStoredSession,
  purgeLegacyTokens,
} from 'lib/auth-service'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTH_URL = 'http://localhost:3333'

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal test JWT with the given exp offset (seconds from now).
 * Uses standard base64 (not base64url) — atob handles both in jsdom.
 */
function makeJwt(expOffsetSeconds: number): string {
  const exp = Math.floor((Date.now() + expOffsetSeconds * 1000) / 1000)
  const payload = btoa(JSON.stringify({ exp }))
  return `header.${payload}.signature`
}

/**
 * Build a test JWT carrying a server-signed `roles` claim (SYN-175). The roles
 * the app gates on must come from here, never from user-editable storage.
 */
function makeJwtWithRoles(expOffsetSeconds: number, roles: string[]): string {
  const exp = Math.floor((Date.now() + expOffsetSeconds * 1000) / 1000)
  const payload = btoa(JSON.stringify({ exp, roles }))
  return `header.${payload}.signature`
}

// ---------------------------------------------------------------------------
// Test user fixtures
// ---------------------------------------------------------------------------

const TEST_USER = { id: 'u1', email: 'test@example.com', firstName: 'Test', lastName: 'User' }

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

/** Seed only the non-credential user profile, as a real prior session would. */
function seedStoredUser() {
  localStorage.setItem('fl_user', JSON.stringify(TEST_USER))
}

/** Assert no credential ever lands in web storage (the SYN-173 invariant). */
function expectNoTokensInStorage() {
  expect(localStorage.getItem('fl_access_token')).toBeNull()
  expect(localStorage.getItem('fl_refresh_token')).toBeNull()
  expect(sessionStorage.getItem('fl_access_token')).toBeNull()
  expect(sessionStorage.getItem('fl_refresh_token')).toBeNull()
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

// ---------------------------------------------------------------------------
// Group 1: Initial auth state
// ---------------------------------------------------------------------------

describe('AuthProvider — initial auth state', () => {
  it('1. no stored user → unauthenticated after mount (no refresh attempted)', async () => {
    // No fl_user → initAuth must not call the refresh endpoint at all.
    // onUnhandledRequest: 'error' would fail the test if it did.
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('2. stored user + valid refresh cookie → authenticated on mount', async () => {
    seedStoredUser()
    const newToken = makeJwt(+3600)

    server.use(
      // Mount bootstraps an access token from the httpOnly cookie.
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json({ accessToken: newToken }, { status: 200 })
      ),
      // reverifyInBackground confirms the new token.
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ user: TEST_USER }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    // SYN-175: the user now always carries token-derived roles (here: none,
    // since these fixtures' tokens have no roles claim).
    expect(result.current.user).toEqual({ ...TEST_USER, roles: [] })
    expectNoTokensInStorage()
  })

  it('3. bootstrapped access token is in memory (getAccessTokenSilently), never in storage', async () => {
    seedStoredUser()
    const newToken = makeJwt(+3600)

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json({ accessToken: newToken }, { status: 200 })
      ),
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ user: TEST_USER }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    let returnedToken: string | undefined
    await act(async () => {
      returnedToken = await result.current.getAccessTokenSilently()
    })

    expect(returnedToken).toBe(newToken)
    expectNoTokensInStorage()
  })

  it('4. stored user + refresh cookie rejected (401) → unauthenticated, user cleared', async () => {
    seedStoredUser()

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json({ error: 'Refresh token expired', statusCode: 401 }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(localStorage.getItem('fl_user')).toBeNull()
    expectNoTokensInStorage()
  })
})

// ---------------------------------------------------------------------------
// Group 2: Login
// ---------------------------------------------------------------------------

describe('AuthProvider — login', () => {
  it('5. successful login → authenticated; token in memory only, user profile persisted', async () => {
    const newToken = makeJwt(+3600)

    server.use(
      http.post(`${AUTH_URL}/auth/login`, () =>
        HttpResponse.json(
          { accessToken: newToken, user: TEST_USER },
          { status: 200 }
        )
      )
      // The proactive refresh scheduler starts when user becomes non-null but
      // schedules far in the future (token expires in 1h), so it will not fire
      // synchronously — no refresh/verify handler needed here.
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' })
    })

    expect(result.current.isAuthenticated).toBe(true)
    // SYN-175: the user now always carries token-derived roles (here: none,
    // since these fixtures' tokens have no roles claim).
    expect(result.current.user).toEqual({ ...TEST_USER, roles: [] })
    // Profile is persisted (cross-tab signal); the access token is not.
    expect(localStorage.getItem('fl_user')).not.toBeNull()
    expectNoTokensInStorage()

    let returnedToken: string | undefined
    await act(async () => {
      returnedToken = await result.current.getAccessTokenSilently()
    })
    expect(returnedToken).toBe(newToken)
  })

  it('6. failed login (401) → throws, remains unauthenticated, nothing stored', async () => {
    server.use(
      http.post(`${AUTH_URL}/auth/login`, () =>
        HttpResponse.json(
          { error: 'Invalid credentials', statusCode: 401 },
          { status: 401 }
        )
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    await act(async () => {
      await expect(
        result.current.login({ email: 'bad@example.com', password: 'wrong' })
      ).rejects.toThrow()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('fl_user')).toBeNull()
    expectNoTokensInStorage()
  })
})

// ---------------------------------------------------------------------------
// Group 3: Logout
// ---------------------------------------------------------------------------

describe('AuthProvider — logout', () => {
  it('7. logout clears state, calls the server to drop the cookie, wipes sessionStorage', async () => {
    const token = makeJwt(+3600)
    let logoutCalled = false

    server.use(
      http.post(`${AUTH_URL}/auth/login`, () =>
        HttpResponse.json({ accessToken: token, user: TEST_USER }, { status: 200 })
      ),
      // serverLogout() must hit this so the httpOnly cookie is dropped.
      http.post(`${AUTH_URL}/auth/logout`, () => {
        logoutCalled = true
        return HttpResponse.json({ message: 'Logged out successfully' }, { status: 200 })
      })
    )

    // Seed sessionStorage keys that clearAuth() is expected to wipe
    const SESSION_KEYS = [
      'token',
      'currentUser',
      'denominationId',
      'oversightId',
      'campusId',
      'streamId',
      'councilId',
      'governorshipId',
      'ministryId',
    ]
    SESSION_KEYS.forEach((k) => sessionStorage.setItem(k, 'some-value'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' })
    })

    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('fl_user')).toBeNull()
    expectNoTokensInStorage()
    SESSION_KEYS.forEach((k) => {
      expect(sessionStorage.getItem(k)).toBeNull()
    })

    await waitFor(() => expect(logoutCalled).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// Group 4: Token refresh
// ---------------------------------------------------------------------------

describe('AuthProvider — token refresh', () => {
  it('8. getAccessTokenSilently with an expired in-memory token → refreshes again, returns new token', async () => {
    seedStoredUser()
    const shortLived = makeJwt(+299) // inside the 5-min expiry buffer → treated as expired
    const fresh = makeJwt(+3600)
    let refreshCalls = 0

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () => {
        refreshCalls += 1
        // First (mount bootstrap) hands back an about-to-expire token; the
        // explicit getAccessTokenSilently call below forces a second refresh.
        return HttpResponse.json(
          { accessToken: refreshCalls === 1 ? shortLived : fresh },
          { status: 200 }
        )
      }),
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ user: TEST_USER }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    let returnedToken: string | undefined
    await act(async () => {
      returnedToken = await result.current.getAccessTokenSilently()
    })

    expect(returnedToken).toBe(fresh)
    expect(refreshCalls).toBeGreaterThanOrEqual(2)
    expectNoTokensInStorage()
  })

  it('9. refresh on mount fails with 401 → isAuthenticated becomes false', async () => {
    seedStoredUser()

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json({ error: 'Refresh token expired', statusCode: 401 }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Group 5: Background reverification
// ---------------------------------------------------------------------------

describe('AuthProvider — reverifyInBackground', () => {
  it('10. verify returns 401 → auth is cleared (user becomes null)', async () => {
    seedStoredUser()
    const token = makeJwt(+3600)

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json({ accessToken: token }, { status: 200 })
      ),
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ error: 'Token revoked', statusCode: 401 }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('fl_user')).toBeNull()
  })

  it('11. verify returns 500 → session preserved', async () => {
    seedStoredUser()
    const token = makeJwt(+3600)

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json({ accessToken: token }, { status: 200 })
      ),
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(true)
    // SYN-175: the user now always carries token-derived roles (here: none,
    // since these fixtures' tokens have no roles claim).
    expect(result.current.user).toEqual({ ...TEST_USER, roles: [] })
  })
})

// ---------------------------------------------------------------------------
// Group 6: SYN-175 — gating roles derive from the signed token, not storage
// ---------------------------------------------------------------------------

describe('AuthProvider — roles come from the signed token (SYN-175)', () => {
  it('17. tampered fl_user roles are ignored; user.roles comes from the token on bootstrap', async () => {
    // Simulate a user who hand-edited localStorage to grant themselves admin.
    localStorage.setItem(
      'fl_user',
      JSON.stringify({ ...TEST_USER, roles: ['adminDenomination'] })
    )
    // The signed token the refresh cookie mints only carries their real role.
    const token = makeJwtWithRoles(+3600, ['leaderBacenta'])

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json({ accessToken: token }, { status: 200 })
      ),
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ user: TEST_USER }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    // The injected admin role is gone — only the token's roles survive.
    expect(result.current.user?.roles).toEqual(['leaderBacenta'])
    expect(result.current.user?.roles).not.toContain('adminDenomination')
  })

  it('18. login derives roles from the token, not the response body user', async () => {
    const token = makeJwtWithRoles(+3600, ['leaderBacenta'])

    server.use(
      http.post(`${AUTH_URL}/auth/login`, () =>
        HttpResponse.json(
          // A compromised/altered response body claiming an admin role…
          {
            accessToken: token,
            user: { ...TEST_USER, roles: ['adminDenomination'] },
          },
          { status: 200 }
        )
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' })
    })

    // …does not win: the signed token is authoritative.
    expect(result.current.user?.roles).toEqual(['leaderBacenta'])
  })

  it('19. a refresh that returns a token with fewer roles downgrades the in-memory user', async () => {
    seedStoredUser()
    const initial = makeJwtWithRoles(+299, ['leaderBacenta', 'leaderGovernorship'])
    const downgraded = makeJwtWithRoles(+3600, ['leaderBacenta'])
    let refreshCalls = 0

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () => {
        refreshCalls += 1
        return HttpResponse.json(
          { accessToken: refreshCalls === 1 ? initial : downgraded },
          { status: 200 }
        )
      }),
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ user: TEST_USER }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    expect(result.current.user?.roles).toEqual([
      'leaderBacenta',
      'leaderGovernorship',
    ])

    // Force a refresh (initial token is inside the expiry buffer) → new token
    // has one fewer role; the in-memory user must reflect the revocation.
    await act(async () => {
      await result.current.getAccessTokenSilently()
    })

    await waitFor(() => {
      expect(result.current.user?.roles).toEqual(['leaderBacenta'])
    })
  })
})

// ---------------------------------------------------------------------------
// Group 7: getRolesFromToken — pure unit tests
// ---------------------------------------------------------------------------

describe('getRolesFromToken — pure function (SYN-175)', () => {
  it('20. extracts the roles claim from a well-formed token', () => {
    expect(getRolesFromToken(makeJwtWithRoles(+3600, ['leaderBacenta']))).toEqual([
      'leaderBacenta',
    ])
  })

  it('21. returns [] for null, malformed, or roles-less tokens', () => {
    expect(getRolesFromToken(null)).toEqual([])
    expect(getRolesFromToken('not.a.jwt.at.all')).toEqual([])
    expect(getRolesFromToken(makeJwt(+3600))).toEqual([])
  })

  it('22. drops non-string entries and a non-array roles claim', () => {
    const mixed = `header.${btoa(JSON.stringify({ roles: ['leaderBacenta', 42, null] }))}.sig`
    expect(getRolesFromToken(mixed)).toEqual(['leaderBacenta'])

    const notArray = `header.${btoa(JSON.stringify({ roles: 'adminDenomination' }))}.sig`
    expect(getRolesFromToken(notArray)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Group 8: isTokenExpired — pure unit tests (no provider, no MSW)
// ---------------------------------------------------------------------------

describe('isTokenExpired — pure function', () => {
  it('12. malformed JWT (not three segments) → treated as expired', () => {
    expect(isTokenExpired('not.a.jwt')).toBe(true)
  })

  it('16. single-segment string → treated as expired', () => {
    expect(isTokenExpired('onlyone')).toBe(true)
  })

  it('13. token with past exp → expired', () => {
    expect(isTokenExpired(makeJwt(-1))).toBe(true)
  })

  it('14. token within 5-minute buffer (exp in 299s) → treated as expired', () => {
    // Buffer is 5 * 60 * 1000 ms = 300 s. At 299s out, we are inside the buffer.
    expect(isTokenExpired(makeJwt(+299))).toBe(true)
  })

  it('15. token beyond buffer (exp in 301s) → treated as valid', () => {
    // At 301s out, we are just outside the 300s buffer.
    expect(isTokenExpired(makeJwt(+301))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Group: pre-SYN-173 stored sessions (SYN-231)
// ---------------------------------------------------------------------------

/**
 * Seed what a browser last signed in on a pre-SYN-173 build carries: both
 * tokens in localStorage and a full `fl_user` (roles included) — but no
 * refresh cookie, which those builds never received.
 */
function seedLegacySession() {
  localStorage.setItem(
    'fl_user',
    JSON.stringify({ ...TEST_USER, roles: ['leaderBacenta'] })
  )
  localStorage.setItem('fl_access_token', makeJwt(-3600))
  localStorage.setItem('fl_refresh_token', 'legacy-refresh-token')
}

describe('AuthProvider — pre-SYN-173 stored session (SYN-231)', () => {
  it('23. legacy session → no cookie-less refresh request; signed out and storage purged', async () => {
    seedLegacySession()
    let refreshCalls = 0
    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () => {
        refreshCalls += 1
        return HttpResponse.json(
          { error: 'No refresh token provided', statusCode: 401 },
          { status: 401 }
        )
      })
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    // The whole point of SYN-231: the auth service is never asked.
    expect(refreshCalls).toBe(0)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(localStorage.getItem('fl_user')).toBeNull()
    expectNoTokensInStorage()
  })

  it('24. re-signed-in since the migration (leftover token key, roles-less fl_user) → still bootstraps from the cookie; leftover purged', async () => {
    seedStoredUser()
    localStorage.setItem('fl_refresh_token', 'legacy-refresh-token')
    const newToken = makeJwt(+3600)
    let refreshCalls = 0

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () => {
        refreshCalls += 1
        return HttpResponse.json({ accessToken: newToken }, { status: 200 })
      }),
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ user: TEST_USER }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(refreshCalls).toBe(1)
    expect(result.current.isAuthenticated).toBe(true)
    expectNoTokensInStorage()
  })

  it('25a. accepted false positive: roles-bearing fl_user + leftover key → signed out without a refresh, even if a cookie exists', async () => {
    // Shape left by a login on the SYN-173-only dev build (roles still
    // written). Pinned so the trade-off documented on isLegacyStoredSession
    // is deliberate: one re-login, never a cookie-less refresh.
    seedLegacySession()
    let refreshCalls = 0
    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () => {
        refreshCalls += 1
        return HttpResponse.json({ accessToken: makeJwt(+3600) }, { status: 200 })
      })
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    expect(refreshCalls).toBe(0)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('25b. logout purges leftover pre-SYN-173 token keys', async () => {
    server.use(
      http.post(`${AUTH_URL}/auth/login`, () =>
        HttpResponse.json(
          { accessToken: makeJwt(+3600), user: TEST_USER },
          { status: 200 }
        )
      ),
      http.post(`${AUTH_URL}/auth/logout`, () =>
        HttpResponse.json({ message: 'ok' }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    await act(async () => {
      await result.current.login({ email: TEST_USER.email, password: 'pw' })
    })

    // Re-plant the keys after login so only logout's clearAuth can remove them.
    localStorage.setItem('fl_access_token', 'legacy-access-token')
    localStorage.setItem('fl_refresh_token', 'legacy-refresh-token')

    await act(async () => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expectNoTokensInStorage()
  })

  it('25. login purges leftover pre-SYN-173 token keys', async () => {
    localStorage.setItem('fl_access_token', 'legacy-access-token')
    localStorage.setItem('fl_refresh_token', 'legacy-refresh-token')
    server.use(
      http.post(`${AUTH_URL}/auth/login`, () =>
        HttpResponse.json(
          { accessToken: makeJwt(+3600), user: TEST_USER },
          { status: 200 }
        )
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: TEST_USER.email, password: 'pw' })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expectNoTokensInStorage()
  })
})

describe('isLegacyStoredSession / purgeLegacyTokens — pure functions (SYN-231)', () => {
  it('26. true only when fl_refresh_token AND a roles-bearing fl_user are both present', () => {
    seedLegacySession()
    expect(isLegacyStoredSession()).toBe(true)
  })

  it('27. false with no leftover refresh token (e.g. tampered fl_user roles alone)', () => {
    localStorage.setItem(
      'fl_user',
      JSON.stringify({ ...TEST_USER, roles: ['adminDenomination'] })
    )
    expect(isLegacyStoredSession()).toBe(false)
  })

  it('28. false when fl_user has no roles key (written by a post-SYN-173 login)', () => {
    seedStoredUser()
    localStorage.setItem('fl_refresh_token', 'legacy-refresh-token')
    expect(isLegacyStoredSession()).toBe(false)
  })

  it('29. false when fl_user is missing or not valid JSON', () => {
    localStorage.setItem('fl_refresh_token', 'legacy-refresh-token')
    expect(isLegacyStoredSession()).toBe(false)
    localStorage.setItem('fl_user', '{not json')
    expect(isLegacyStoredSession()).toBe(false)
  })

  it('30. purgeLegacyTokens removes both legacy keys and leaves fl_user alone', () => {
    seedLegacySession()
    purgeLegacyTokens()
    expectNoTokensInStorage()
    expect(localStorage.getItem('fl_user')).not.toBeNull()
  })
})
