/**
 * Custom Authentication Context
 * Replaces Auth0Provider with custom auth service integration
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
  getRefreshToken,
  getStoredUser,
  isTokenExpired,
  AuthUser,
  LoginData,
  SignupData,
  ResetPasswordData,
  SetupPasswordData,
} from '@/lib/auth-service'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Refresh the access token if needed
   */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const currentRefreshToken = getRefreshToken()

    if (!currentRefreshToken) {
      return null
    }

    try {
      const response = await apiRefreshToken(currentRefreshToken)
      storeAuth({
        message: 'Token refreshed',
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: user!,
      })

      return response.accessToken
    } catch (error) {
      console.error('Failed to refresh token:', error)
      clearAuth()
      setUser(null)
      return null
    }
  }, [user])

  /**
   * Get access token silently (refresh if needed)
   */
  const getAccessTokenSilently = useCallback(async (): Promise<string> => {
    let token = getAccessToken()

    if (!token) {
      throw new Error('No access token available')
    }

    // Check if token is expired and refresh if needed
    if (isTokenExpired(token)) {
      const newToken = await refreshAccessToken()

      if (!newToken) {
        throw new Error('Failed to refresh access token')
      }

      token = newToken
    }

    return token
  }, [refreshAccessToken])

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)

      const token = getAccessToken()
      const storedUser = getStoredUser()

      if (token && storedUser) {
        // Verify token is still valid
        if (isTokenExpired(token)) {
          // Try to refresh
          const newToken = await refreshAccessToken()

          if (newToken) {
            setUser(storedUser)
          } else {
            clearAuth()
            setUser(null)
          }
        } else {
          // Verify with backend
          const verifiedUser = await verifyToken(token)

          if (verifiedUser) {
            setUser(verifiedUser)
          } else {
            clearAuth()
            setUser(null)
          }
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [refreshAccessToken])

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

/**
 * Backward compatibility with Auth0 hook name
 */
export const useAuth0 = useAuth
