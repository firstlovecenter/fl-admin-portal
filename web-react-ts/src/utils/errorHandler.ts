import React from 'react'
import { ApolloError } from '@apollo/client'
import { enqueueSnackbar } from 'notistack'

/**
 * Extracts the first meaningful error message from a GraphQL error
 * Handles permission errors, validation errors, and other GraphQL errors
 */
export const getGraphQLErrorMessage = (error: unknown): string => {
  if (!error) return 'An unknown error occurred'

  if (error instanceof ApolloError) {
    // First, try to get the most relevant GraphQL error message
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      // Look for permission or permission-related errors first
      const permissionError = error.graphQLErrors.find((err) =>
        err.message.toLowerCase().includes('permit')
      )
      if (permissionError) {
        return permissionError.message
      }

      // Return the first error if no specific type found
      return error.graphQLErrors[0].message
    }

    // Fall back to network error if no graphQL errors
    if (error.networkError) {
      return error.networkError.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

/**
 * Displays an error using industry-standard snackbar notification
 * This provides consistent error feedback across the application
 */
export const displayError = (
  title: string,
  error: unknown,
  autoHideDuration = 15000
) => {
  const errorMessage = getGraphQLErrorMessage(error)
  const fullMessage = `${title}: ${errorMessage}`

  enqueueSnackbar(fullMessage, {
    variant: 'error',
    autoHideDuration,
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'right',
    },
    preventDuplicate: true,
  })
}

/**
 * Extracts all GraphQL error messages from an ApolloError
 * Useful for logging or detailed error handling
 */
export const getAllGraphQLErrorMessages = (error: ApolloError): string[] => {
  if (!error.graphQLErrors || error.graphQLErrors.length === 0) {
    return []
  }
  return error.graphQLErrors.map((err) => err.message)
}

/**
 * Checks if an error is a permission/authorization error
 */
export const isPermissionError = (error: unknown): boolean => {
  if (error instanceof ApolloError) {
    const message = getGraphQLErrorMessage(error).toLowerCase()
    return (
      message.includes('permit') ||
      message.includes('authorized') ||
      message.includes('unauthorized')
    )
  }
  return false
}
