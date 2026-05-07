/**
 * FL Auth Service Client
 * Client library for interacting with the custom authentication microservice
 */

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || ''

if (!AUTH_API_URL) {
  throw new Error(
    'VITE_AUTH_API_URL is missing. Set it in AWS Secrets Manager (or .env.local) to avoid requests defaulting to the Amplify domain.'
  )
}

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
  accessToken: string
  refreshToken: string
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
 * Storage keys for tokens
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'fl_access_token',
  REFRESH_TOKEN: 'fl_refresh_token',
  USER: 'fl_user',
} as const

/**
 * Routes that render without authentication (login, password setup, etc.)
 */
export const PUBLIC_AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/setup-password',
] as const

/**
 * Whether a given pathname is a public auth route. Trailing slashes are
 * normalised; query strings and hashes should be stripped before calling.
 */
export function isPublicAuthRoute(pathname: string): boolean {
  const normalised = pathname.replace(/\/$/, '') || '/'
  return PUBLIC_AUTH_ROUTES.some((route) => {
    const normalisedRoute = route.replace(/\/$/, '') || '/'
    return normalised === normalisedRoute
  })
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
 * Store authentication data
 */
export function storeAuth(data: AuthTokens): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken)
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))
}

/**
 * Clear all authentication data from localStorage and sessionStorage
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return

  // Clear localStorage
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)

  // Clear sessionStorage
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('currentUser')
  sessionStorage.removeItem('denominationId')
  sessionStorage.removeItem('oversightId')
  sessionStorage.removeItem('campusId')
  sessionStorage.removeItem('streamId')
  sessionStorage.removeItem('councilId')
  sessionStorage.removeItem('governorshipId')
  sessionStorage.removeItem('hubId')
  sessionStorage.removeItem('hubCouncilId')
  sessionStorage.removeItem('ministryId')
  sessionStorage.removeItem('creativeArtsId')
}

/**
 * Treat the access token as expired this far in advance of its actual `exp`.
 * Shared with the proactive refresh scheduler in AuthContext so on-request
 * refresh and timer-driven refresh agree on when a token has gone stale.
 */
export const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000

/**
 * Decode the `exp` claim (milliseconds since epoch) from a JWT, or null if
 * the token is malformed or missing the claim.
 */
export function getTokenExpiryMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (typeof payload?.exp !== 'number') return null
    return payload.exp * 1000
  } catch {
    return null
  }
}

/**
 * Check if access token is expired (with the shared buffer applied).
 */
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiryMs(token)
  if (exp === null) return true
  return Date.now() >= exp - ACCESS_TOKEN_EXPIRY_BUFFER_MS
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

  // Handle both nested and flat token structures
  const accessToken = result.accessToken || result.tokens?.accessToken
  const refreshToken = result.refreshToken || result.tokens?.refreshToken

  return {
    accessToken,
    refreshToken,
    user: result.user,
  }
}

/**
 * Verify if a token is valid. Throws AuthServiceError on rejection (401) so
 * callers can distinguish explicit revocation from transient failures.
 */
export async function verifyToken(token: string): Promise<AuthUser> {
  const response = await fetch(`${AUTH_API_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })

  // Branch on response.ok before parsing JSON so a non-JSON error body
  // (gateway 401 HTML page, empty 504, etc.) still surfaces as an
  // AuthServiceError with the real status code rather than a SyntaxError
  // that callers would mistake for a transient failure.
  if (!response.ok) {
    let errorMessage = 'Token verification failed'
    let requestId: string | undefined
    try {
      const errorBody = await response.json()
      errorMessage = errorBody.error || errorMessage
      requestId = errorBody.requestId
    } catch {
      // Non-JSON error body — fall through with status code only.
    }
    throw new AuthServiceError(errorMessage, response.status, requestId)
  }

  const result = await response.json()
  return result.user
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

  // Get the current (possibly expired) access token
  const currentAccessToken = getAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Include the access token in Authorization header if available
  // Many auth services require this for security
  if (currentAccessToken) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`
  }

  const response = await fetch(`${AUTH_API_URL}/auth/refresh-token`, {
    method: 'POST',
    headers,
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
 * Request password reset (forgot password)
 */
export async function requestPasswordReset(
  email: string
): Promise<{ message: string }> {
  const response = await fetch(`${AUTH_API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new AuthServiceError(
      result.error || 'Password reset request failed',
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

export { AuthServiceError }
