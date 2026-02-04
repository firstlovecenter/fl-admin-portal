/**
 * FL Auth Service Client
 * Client library for interacting with the custom authentication microservice
 */

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || ''

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  roles?: string[]
}

export interface TokensPair {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  message: string
  tokens: TokensPair
  user: AuthUser
}

// Flattened version for internal use
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface SignupData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface ResetPasswordData {
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface SetupPasswordData {
  email: string
  token: string
  password: string
}

class AuthServiceError extends Error {
  statusCode: number

  requestId?: string

  constructor(message: string, statusCode: number, requestId?: string) {
    super(message)
    this.name = 'AuthServiceError'
    this.statusCode = statusCode
    this.requestId = requestId
  }
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupData): Promise<AuthTokens> {
  const response = await fetch(`${AUTH_API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new AuthServiceError(
      result.error || 'Signup failed',
      result.statusCode || response.status,
      result.requestId
    )
  }

  // After signup, automatically log them in
  return login({ email: data.email, password: data.password })
}

/**
 * Log in a user
 */
export async function login(data: LoginData): Promise<AuthTokens> {
  const response = await fetch(`${AUTH_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new AuthServiceError(
      result.error || 'Login failed',
      result.statusCode || response.status,
      result.requestId
    )
  }

  // Flatten the nested token structure
  return {
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    user: result.user,
  }
}

/**
 * Verify if a token is valid
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${AUTH_API_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    return result.user
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  if (!refreshToken) {
    throw new AuthServiceError('No refresh token available', 401, undefined)
  }

  const response = await fetch(`${AUTH_API_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new AuthServiceError(
      result.error || 'Token refresh failed',
      result.statusCode || response.status,
      result.requestId
    )
  }

  return result
}

/**
 * Set up password for migrated users
 */
export async function setupPassword(
  data: SetupPasswordData
): Promise<{ message: string; user: AuthUser }> {
  const response = await fetch(`${AUTH_API_URL}/auth/setup-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new AuthServiceError(
      result.error || 'Password setup failed',
      result.statusCode || response.status,
      result.requestId
    )
  }

  return result
}

/**
 * Reset password (requires current password)
 */
export async function resetPassword(
  data: ResetPasswordData
): Promise<{ message: string; user: AuthUser }> {
  const response = await fetch(`${AUTH_API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new AuthServiceError(
      result.error || 'Password reset failed',
      result.statusCode || response.status,
      result.requestId
    )
  }

  return result
}

/**
 * Delete user account
 */
export async function deleteAccount(
  token: string
): Promise<{ message: string; accountId: string }> {
  const response = await fetch(`${AUTH_API_URL}/auth/delete-account`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, confirmDeletion: true }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new AuthServiceError(
      result.error || 'Account deletion failed',
      result.statusCode || response.status,
      result.requestId
    )
  }

  return result
}

/**
 * Storage keys for tokens
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'fl_access_token',
  REFRESH_TOKEN: 'fl_refresh_token',
  USER: 'fl_user',
} as const

/**
 * Store authentication data
 */
export function storeAuth(data: AuthTokens): void {
  if (typeof window === 'undefined') return

  // eslint-disable-next-line no-console
  console.log('🔐 Storing auth tokens', {
    hasAccessToken: !!data.accessToken,
    hasRefreshToken: !!data.refreshToken,
    user: data.user,
  })

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken)
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

  return token
}

/**
 * Get stored user data
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null

  const userStr = localStorage.getItem(STORAGE_KEYS.USER)
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
}

/**
 * Check if access token is expired (with 5 minute buffer)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000 // Convert to milliseconds
    const now = Date.now()
    const bufferTime = 5 * 60 * 1000 // 5 minutes

    return now >= exp - bufferTime
  } catch {
    return true
  }
}

export { AuthServiceError }
