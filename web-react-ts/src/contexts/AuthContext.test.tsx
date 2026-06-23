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
import { isTokenExpired } from 'lib/auth-service'

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
    expect(result.current.user).toEqual(TEST_USER)
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
    expect(result.current.user).toEqual(TEST_USER)
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
    expect(result.current.user).toEqual(TEST_USER)
  })
})

// ---------------------------------------------------------------------------
// Group 6: isTokenExpired — pure unit tests (no provider, no MSW)
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
