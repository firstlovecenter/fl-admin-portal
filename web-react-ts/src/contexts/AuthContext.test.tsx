/**
 * AuthContext.test.tsx — SYN-65
 *
 * Characterization + unit tests for:
 *   - AuthProvider (initial state, login, logout, refresh, reverify)
 *   - isTokenExpired (pure function from lib/auth-service)
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
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
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
  it('1. no stored token → unauthenticated after mount', async () => {
    // No localStorage entries, no MSW handlers needed.
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('2. valid stored token + user → authenticated on mount (verify returns 200)', async () => {
    const token = makeJwt(+3600)
    localStorage.setItem('fl_access_token', token)
    localStorage.setItem('fl_refresh_token', 'rt-valid')
    localStorage.setItem('fl_user', JSON.stringify(TEST_USER))

    // reverifyInBackground fires a POST /auth/verify — must be handled
    server.use(
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ user: TEST_USER }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Wait for initAuth to complete
    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toEqual(TEST_USER)
  })

  it('3. expired stored token, refresh succeeds → authenticated after mount', async () => {
    const expiredToken = makeJwt(-1)
    const newToken = makeJwt(+3600)
    localStorage.setItem('fl_access_token', expiredToken)
    localStorage.setItem('fl_refresh_token', 'rt-valid')
    localStorage.setItem('fl_user', JSON.stringify(TEST_USER))

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json(
          { accessToken: newToken, refreshToken: 'rt-new' },
          { status: 200 }
        )
      ),
      // reverifyInBackground is called with the new token after refresh
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ user: TEST_USER }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(localStorage.getItem('fl_access_token')).toBe(newToken)
  })

  it('4. expired stored token, refresh fails with 401 → unauthenticated, storage cleared', async () => {
    const expiredToken = makeJwt(-1)
    localStorage.setItem('fl_access_token', expiredToken)
    localStorage.setItem('fl_refresh_token', 'rt-expired')
    localStorage.setItem('fl_user', JSON.stringify(TEST_USER))

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json({ error: 'Refresh token expired', statusCode: 401 }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(localStorage.getItem('fl_access_token')).toBeNull()
    expect(localStorage.getItem('fl_refresh_token')).toBeNull()
    expect(localStorage.getItem('fl_user')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Group 2: Login
// ---------------------------------------------------------------------------

describe('AuthProvider — login', () => {
  it('5. successful login → authenticated, token in localStorage', async () => {
    const newToken = makeJwt(+3600)

    server.use(
      http.post(`${AUTH_URL}/auth/login`, () =>
        HttpResponse.json(
          { accessToken: newToken, refreshToken: 'rt-1', user: TEST_USER },
          { status: 200 }
        )
      ),
      // The proactive refresh scheduler starts when user becomes non-null.
      // It schedules a setTimeout well in the future (newToken expires in 1h),
      // so it will not fire synchronously during the test — no verify needed.
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Let initAuth settle (no stored token → immediate)
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(TEST_USER)
    expect(localStorage.getItem('fl_access_token')).toBe(newToken)
  })

  it('6. failed login (401) → throws, remains unauthenticated, no token stored', async () => {
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
    expect(localStorage.getItem('fl_access_token')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Group 3: Logout
// ---------------------------------------------------------------------------

describe('AuthProvider — logout', () => {
  it('7. logout clears user state, localStorage, and all sessionStorage keys', async () => {
    const token = makeJwt(+3600)

    server.use(
      http.post(`${AUTH_URL}/auth/login`, () =>
        HttpResponse.json(
          { accessToken: token, refreshToken: 'rt-1', user: TEST_USER },
          { status: 200 }
        )
      )
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
    expect(localStorage.getItem('fl_access_token')).toBeNull()
    expect(localStorage.getItem('fl_refresh_token')).toBeNull()
    expect(localStorage.getItem('fl_user')).toBeNull()
    SESSION_KEYS.forEach((k) => {
      expect(sessionStorage.getItem(k)).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// Group 4: Token refresh
// ---------------------------------------------------------------------------

describe('AuthProvider — token refresh', () => {
  it('8. getAccessTokenSilently with expired stored token → refreshes, returns new token', async () => {
    const expiredToken = makeJwt(-1)
    const newToken = makeJwt(+3600)
    localStorage.setItem('fl_access_token', expiredToken)
    localStorage.setItem('fl_refresh_token', 'rt-valid')
    localStorage.setItem('fl_user', JSON.stringify(TEST_USER))

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json(
          { accessToken: newToken, refreshToken: 'rt-new' },
          { status: 200 }
        )
      ),
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ user: TEST_USER }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // initAuth will trigger refreshAccessToken because token is expired
    await act(async () => {})

    // After refresh on mount, the access token in storage is the new token.
    // Now call getAccessTokenSilently — the new token is valid, so no refresh.
    let returnedToken: string | undefined
    await act(async () => {
      returnedToken = await result.current.getAccessTokenSilently()
    })

    expect(returnedToken).toBe(newToken)
    expect(localStorage.getItem('fl_access_token')).toBe(newToken)
  })

  it('8b. refresh response omits refreshToken → existing one is preserved, not clobbered (SYN-166)', async () => {
    // The real /auth/refresh-token Lambda returns only { accessToken } because
    // refresh tokens are non-rotating. The FE must keep the existing refresh
    // token rather than overwriting it with `undefined` ("undefined" string),
    // which would 401 every subsequent refresh and revert SYN-166's token
    // re-mint to a blank dashboard.
    const expiredToken = makeJwt(-1)
    const newToken = makeJwt(+3600)
    localStorage.setItem('fl_access_token', expiredToken)
    localStorage.setItem('fl_refresh_token', 'rt-valid')
    localStorage.setItem('fl_user', JSON.stringify(TEST_USER))

    server.use(
      http.post(`${AUTH_URL}/auth/refresh-token`, () =>
        HttpResponse.json(
          { message: 'Token refreshed successfully', accessToken: newToken },
          { status: 200 }
        )
      ),
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ user: TEST_USER }, { status: 200 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // initAuth refreshes because the stored access token is expired.
    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('fl_access_token')).toBe(newToken)
    // The valid refresh token must survive a server response that omits it.
    expect(localStorage.getItem('fl_refresh_token')).toBe('rt-valid')
  })

  it('9. refreshAccessToken fails with 401 → isAuthenticated becomes false', async () => {
    const expiredToken = makeJwt(-1)
    localStorage.setItem('fl_access_token', expiredToken)
    localStorage.setItem('fl_refresh_token', 'rt-expired')
    localStorage.setItem('fl_user', JSON.stringify(TEST_USER))

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
    const token = makeJwt(+3600)
    localStorage.setItem('fl_access_token', token)
    localStorage.setItem('fl_refresh_token', 'rt-valid')
    localStorage.setItem('fl_user', JSON.stringify(TEST_USER))

    server.use(
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ error: 'Token revoked', statusCode: 401 }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // initAuth runs synchronously setting user, then reverifyInBackground fires async
    await act(async () => {})

    // Wait for the background verify to settle and clear the user
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('fl_access_token')).toBeNull()
  })

  it('11. verify returns 500 → session preserved', async () => {
    const token = makeJwt(+3600)
    localStorage.setItem('fl_access_token', token)
    localStorage.setItem('fl_refresh_token', 'rt-valid')
    localStorage.setItem('fl_user', JSON.stringify(TEST_USER))

    server.use(
      http.post(`${AUTH_URL}/auth/verify`, () =>
        HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    // After initAuth settles, user should be set immediately from localStorage.
    // The verify is in background and returns 500 — session must be preserved.
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Give the background verify time to resolve (it's already resolved via MSW
    // since act() flushes microtasks). isAuthenticated must still be true.
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
