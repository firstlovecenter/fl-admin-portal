/**
 * Custom JWT verification for FL Auth Service
 * Replaces Auth0 JWT verification
 */

import axios from 'axios'
import { throwToSentry } from './utils/utils'
import { loadSecrets } from './secrets'

export interface DecodedToken {
  userId: string
  email: string
  iat: number
  exp: number
}

export interface VerifiedUser {
  userId: string
  email: string
}

/**
 * Verify JWT token with the auth service
 */
export const verifyAuthToken = async (
  token: string
): Promise<VerifiedUser | null> => {
  try {
    const SECRETS = await loadSecrets()
    const { AUTH_API_URL } = SECRETS

    const response = await axios.post(`${AUTH_API_URL}/auth/verify`, {
      token,
    })

    if (response.data && response.data.user) {
      return {
        userId: response.data.user.userId,
        email: response.data.user.email,
      }
    }

    return null
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Decode JWT token (without verification - use only for extracting claims)
 * This is safe for getting user ID and email since the token is verified separately
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    return decoded
  } catch (error) {
    throwToSentry('Failed to decode JWT token', error)
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string) => {
  if (!authHeader) {
    return null
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return authHeader
}

/**
 * Get user from JWT token in context
 * This replaces the Auth0 user extraction
 */
export const getUserFromToken = async (
  authHeader?: string
): Promise<VerifiedUser | null> => {
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return null
  }

  // Verify token with auth service
  const user = await verifyAuthToken(token)

  return user
}
