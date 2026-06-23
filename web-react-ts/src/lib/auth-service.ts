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

// Flattened version for internal use. SYN-173: the refresh token is no longer
// handled by the client — it lives only in an httpOnly cookie set by the auth
// service — so it is intentionally absent here.
export interface AuthTokens {
  accessToken: string
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
 * SYN-173: the short-lived access token is held in this module-scoped variable
 * (memory only), never in localStorage/sessionStorage. It is wiped on a full
 * page reload — AuthContext bootstraps a fresh one from the httpOnly refresh
 * cookie on mount. The refresh token never touches JavaScript at all.
 */
let inMemoryAccessToken: string | null = null

/**
 * Storage keys. Only the non-credential user profile is persisted — it doubles
 * as the cross-tab login/logout signal (see AuthContext). No token is stored.
 */
export const STORAGE_KEYS = {
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
 * Get the in-memory access token (null after a reload, until refreshed).
 */
export function getAccessToken(): string | null {
  return inMemoryAccessToken
}

/**
 * Set (or clear) the in-memory access token. Called on login and on every
 * silent refresh so Apollo's auth link always reads the freshest token.
 */
export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token
}

/**
 * Return a usable access token, minting a fresh one from the httpOnly refresh
 * cookie when the in-memory token is missing (e.g. right after a reload) or
 * past its expiry buffer. For non-React callers (the download/export helpers)
 * that used to read the persisted token synchronously — React components should
 * use `getAccessTokenSilently` from `useAuth()` instead. Throws if no valid
 * session can be established.
 */
export async function getValidAccessToken(): Promise<string> {
  if (inMemoryAccessToken && !isTokenExpired(inMemoryAccessToken)) {
    return inMemoryAccessToken
  }
  const { accessToken } = await refreshToken()
  inMemoryAccessToken = accessToken
  return accessToken
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
  inMemoryAccessToken = data.accessToken
  if (typeof window === 'undefined') return
  // SYN-175: never persist `roles` to localStorage — they are user-editable
  // there and the app must not gate on them. Gating roles are re-derived from
  // the signed access token on every login/bootstrap/refresh. Only the
  // non-credential display profile is persisted (also the cross-tab signal).
  const profile = { ...data.user }
  delete profile.roles
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile))
}

/**
 * Clear all authentication data from localStorage and sessionStorage
 */
export function clearAuth(): void {
  inMemoryAccessToken = null
  if (typeof window === 'undefined') return

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
  sessionStorage.removeItem('ministryId')
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
 * SYN-175: decode the server-signed `roles` claim from the in-memory access
 * token. This is the *authoritative* source of client gating roles — unlike
 * `localStorage.fl_user`, the user cannot edit it without invalidating the
 * signature (the API would then reject the token). Returns `[]` on a malformed
 * token, a missing/ non-array claim, or any role entry that is not a string.
 *
 * Treat the roles persisted in storage as advisory display data only; never
 * gate UI on them — always re-derive from here.
 */
export function getRolesFromToken(token: string | null): string[] {
  if (!token) return []
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!Array.isArray(payload?.roles)) return []
    return payload.roles.filter((r: unknown): r is string => typeof r === 'string')
  } catch {
    return []
  }
}

/**
 * Order-insensitive equality for two role lists. Shared by AuthContext (refresh)
 * and AppWithContext (the currentUser sync effect) to avoid pointless re-renders
 * when a refresh returns the same roles.
 */
export function sameRoles(a: string[] = [], b: string[] = []): boolean {
  return a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')
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
    // Include credentials so the browser stores the httpOnly refresh cookie the
    // auth service sets on success (SYN-173).
    credentials: 'include',
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

  // Access token may be nested (tokens.accessToken) or flat depending on the
  // endpoint version. The refresh token is intentionally ignored — it now
  // lives only in the httpOnly cookie.
  const accessToken = result.accessToken || result.tokens?.accessToken

  return {
    accessToken,
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
 * Exchange the httpOnly refresh cookie for a fresh access token. The cookie is
 * sent automatically by the browser (credentials: 'include'); no token is read
 * from or passed by JavaScript (SYN-173).
 */
export async function refreshToken(): Promise<{ accessToken: string }> {
  const response = await fetch(`${AUTH_API_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
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
 * Tell the auth service to clear the httpOnly refresh cookie. Best-effort:
 * failures are swallowed because local logout (clearAuth) must proceed
 * regardless of network state, and the cookie expires on its own (SYN-173).
 */
export async function serverLogout(): Promise<void> {
  try {
    await fetch(`${AUTH_API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
  } catch {
    // Ignore network errors — the access token is already gone from memory.
  }
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
