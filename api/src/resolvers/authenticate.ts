/**
 * Authentication utilities for custom auth service
 * No longer using Auth0 - token verification is done in index.js context creation
 */

// Placeholder exports to maintain compatibility with existing code
// These functions are no longer used - left for backward compatibility during migration
export const getAuthToken = async () => {
  throw new Error(
    'Auth0 is no longer supported. Use custom auth service instead.'
  )
}

export const getAuth0Roles = async () => {
  throw new Error(
    'Auth0 is no longer supported. Roles are fetched from Neo4j database.'
  )
}
