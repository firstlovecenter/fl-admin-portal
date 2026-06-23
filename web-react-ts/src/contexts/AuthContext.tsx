/**
 * Custom Authentication Context
 */

'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import {
  login as apiLogin,
  signup as apiSignup,
  verifyToken,
  refreshToken as apiRefreshToken,
  resetPassword as apiResetPassword,
  setupPassword as apiSetupPassword,
  storeAuth,
  clearAuth,
  getAccessToken,
  setAccessToken,
  serverLogout,
  getStoredUser,
  getTokenExpiryMs,
  isTokenExpired,
  AuthServiceError,
  AuthUser,
  LoginData,
  SignupData,
  ResetPasswordData,
  SetupPasswordData,
  STORAGE_KEYS,
  ACCESS_TOKEN_EXPIRY_BUFFER_MS,
} from '../lib/auth-service'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => void
  resetPassword: (data: ResetPasswordData) => Promise<void>
  setupPassword: (data: SetupPasswordData) => Promise<void>
  getAccessTokenSilently: () => Promise<string>
  refreshAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Refresh the access token if needed
   */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      // The refresh token rides along as an httpOnly cookie (SYN-173); we only
      // get back a fresh access token, which we hold in memory.
      const response = await apiRefreshToken()
      setAccessToken(response.accessToken)
      return response.accessToken
    } catch (error: any) {
      // Only clear auth when the cookie is actually rejected (401). Transient
      // failures (network, 5xx) leave the current session intact so the PWA
      // stays usable offline.
      if (error.statusCode === 401) {
        clearAuth()
        setUser(null)
      }

      return null
    }
  }, [])

  /**
   * Get access token silently (refresh if needed)
   */
  const getAccessTokenSilently = useCallback(async (): Promise<string> => {
    let token = getAccessToken()

    // No in-memory token (e.g. just after a reload) or an expired one — mint a
    // fresh access token from the httpOnly refresh cookie.
    if (!token || isTokenExpired(token)) {
      const newToken = await refreshAccessToken()

      if (!newToken) {
        throw new Error('Failed to refresh access token')
      }

      token = newToken
    }

    return token
  }, [refreshAccessToken])

  /**
   * Re-verify the given access token with the backend in the background.
   * Catches server-side revocation (role change, account disabled) without
   * blocking first paint. Only logs out on explicit 401 — transient errors
   * (network, 5xx) leave the session intact so the PWA stays usable offline.
   *
   * Re-checks the live access token before clearing to avoid logging out a
   * session that has since been rotated (refresh) or replaced (logout +
   * fresh login) while the verify request was in flight.
   */
  const reverifyInBackground = useCallback((tokenToVerify: string) => {
    verifyToken(tokenToVerify).catch((error: unknown) => {
      if (!(error instanceof AuthServiceError) || error.statusCode !== 401) {
        return
      }
      // Only clear if the token we verified is still the one in use.
      if (getAccessToken() !== tokenToVerify) return
      clearAuth()
      setUser(null)
    })
  }, [])

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)

      const storedUser = getStoredUser()

      // SYN-173: the access token lives in memory only, so a reload always
      // starts with none. If a previous session left a stored user, bootstrap
      // a fresh access token from the httpOnly refresh cookie; the stored user
      // gives us first paint while the background re-verify confirms identity.
      if (storedUser) {
        const newToken = await refreshAccessToken()

        if (newToken) {
          setUser(storedUser)
          reverifyInBackground(newToken)
        } else {
          clearAuth()
          setUser(null)
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [refreshAccessToken, reverifyInBackground])

  /**
   * Proactive silent refresh. While a user session is active, schedule a
   * refresh ~1 minute before the access token's `exp` so idle sessions
   * stay alive without the user noticing. On success, reschedule from the
   * new token's `exp`. On failure, `refreshAccessToken` already clears
   * auth (which will tear down this effect via the `user` dep), so we
   * just stop scheduling.
   */
  useEffect(() => {
    if (!user) return undefined

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const scheduleNext = () => {
      if (cancelled) return

      const token = getAccessToken()
      if (!token) return

      const exp = getTokenExpiryMs(token)
      if (exp === null) return

      const minDelay = 5 * 1000
      const delay = Math.max(
        exp - Date.now() - ACCESS_TOKEN_EXPIRY_BUFFER_MS,
        minDelay
      )

      timeoutId = setTimeout(async () => {
        if (cancelled) return
        const next = await refreshAccessToken()
        if (cancelled) return
        if (next) scheduleNext()
      }, delay)
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [user, refreshAccessToken])

  /**
   * Cross-tab auth sync. The `storage` event fires same-origin only, on
   * other documents (never the originating tab), so there is no self-loop.
   *
   * We watch the USER key rather than the access token because token
   * rotation during a refresh writes a fresh access token but leaves USER
   * unchanged — listening on USER lets us ignore refreshes and only react
   * to logout / login / user-switch.
   *
   *   USER removed  → another tab logged out: clear in-memory user.
   *   USER changed  → another tab logged in (possibly as a different user):
   *                   full reload so Apollo cache, ChurchContext, and
   *                   MemberContext rebuild against the new identity. This
   *                   matches the in-tab login path which also reloads via
   *                   `window.location.href = '/'`.
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEYS.USER) return

      if (event.newValue === null) {
        setUser(null)
      } else if (event.newValue !== event.oldValue) {
        window.location.reload()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  /**
   * Login handler
   */
  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true)

    try {
      const response = await apiLogin(data)
      storeAuth(response)
      setUser(response.user)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Signup handler
   */
  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true)

    try {
      const response = await apiSignup(data)
      storeAuth(response)
      setUser(response.user)
    } catch (error) {
      console.error('Signup failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Logout handler
   */
  const logout = useCallback(() => {
    // Clear the httpOnly refresh cookie server-side (page JS cannot touch it),
    // then drop local state. Best-effort — clearAuth proceeds regardless.
    serverLogout()
    clearAuth()
    setUser(null)
  }, [])

  /**
   * Reset password handler
   */
  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    try {
      await apiResetPassword(data)
    } catch (error) {
      console.error('Password reset failed:', error)
      throw error
    }
  }, [])

  /**
   * Setup password handler (for migrated users)
   */
  const setupPassword = useCallback(async (data: SetupPasswordData) => {
    try {
      await apiSetupPassword(data)
    } catch (error) {
      console.error('Password setup failed:', error)
      throw error
    }
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    resetPassword,
    setupPassword,
    getAccessTokenSilently,
    refreshAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
