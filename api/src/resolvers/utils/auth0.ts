/**
 * DEPRECATED: Auth0 utilities
 *
 * This file is kept for historical reference only.
 * Auth0 integration has been completely removed from the application.
 *
 * User authentication is now handled by a custom authentication service.
 * Roles are managed directly in the Neo4j database instead of Auth0.
 *
 * All functions in this file should no longer be used.
 */

export type Auth0RoleObject = {
  id: string
  name: string
  description: string
}

// Placeholder exports to prevent import errors during migration
export const createAuthUserConfig = async () => {
  throw new Error(
    'Auth0 integration has been removed. Use custom auth service instead.'
  )
}

export const updateAuthUserConfig = async () => {
  throw new Error(
    'Auth0 integration has been removed. Use custom auth service instead.'
  )
}

export const changePasswordConfig = async () => {
  throw new Error(
    'Auth0 integration has been removed. Use custom auth service instead.'
  )
}

export const deleteAuthUserConfig = async () => {
  throw new Error(
    'Auth0 integration has been removed. Use custom auth service instead.'
  )
}

export const getAuthIdConfig = async () => {
  throw new Error(
    'Auth0 integration has been removed. Use custom auth service instead.'
  )
}

export const getUserRoles = async () => {
  throw new Error(
    'Auth0 integration has been removed. Roles are now managed in Neo4j.'
  )
}

export const setUserRoles = async () => {
  throw new Error(
    'Auth0 integration has been removed. Roles are now managed in Neo4j.'
  )
}

export const deleteUserRoles = async () => {
  throw new Error(
    'Auth0 integration has been removed. Roles are now managed in Neo4j.'
  )
}

export const deleteRole = async () => {
  throw new Error(
    'Auth0 integration has been removed. Roles are now managed in Neo4j.'
  )
}
