'use client'

import React, { ReactNode } from 'react'
import { RetryLink } from '@apollo/client/link/retry'
import { onError } from '@apollo/client/link/error'
import {
  ApolloClient,
  ApolloProvider,
  createHttpLink,
  from,
  InMemoryCache,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { useAuth } from '@/contexts/AuthContext'
import { useCallback, useEffect, useState } from 'react'
import {
  SnackbarKey,
  SnackbarProvider,
  closeSnackbar,
  enqueueSnackbar,
} from 'notistack'
import { Button, Card } from 'react-bootstrap'

interface ApolloProviderProps {
  children: ReactNode
}

function ApolloWrapper({ children }: ApolloProviderProps) {
  const [accessToken, setAccessToken] = useState<string>('')
  const [client, setClient] = useState<ApolloClient<any> | null>(null)
  const { getAccessTokenSilently, isAuthenticated } = useAuth()

  const getAccessToken = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const token = await getAccessTokenSilently()

      setAccessToken(token)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('token', token)
      }
    } catch (err) {
      // eslint-disable-next-line
      console.error('Error Obtaining Token', err)
    }
  }, [getAccessTokenSilently, isAuthenticated])

  useEffect(() => {
    getAccessToken()
  }, [getAccessToken])

  useEffect(() => {
    const endpoint =
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
      'http://localhost:3000/api/graphql'

    console.log('🔗 Apollo Client initializing with endpoint:', endpoint)

    const httpLink = createHttpLink({
      uri: endpoint,
      credentials: 'include',
    })

    const authLink = setContext((_, { headers }) => {
      const token =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('token') || accessToken
          : accessToken

      return {
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`,
        },
      }
    })

    const retryLink = new RetryLink({
      delay: {
        initial: 300,
        max: 2000,
        jitter: true,
      },
      attempts: {
        max: 5,
      },
    })

    const action = (snackbarId: SnackbarKey | undefined) => (
      <Button
        variant="outline-light"
        onClick={() => {
          closeSnackbar(snackbarId)
        }}
      >
        Dismiss
      </Button>
    )

    const errorLink = onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
          if (message.includes('Unauthenticated')) return

          enqueueSnackbar(
            <Card>
              <Card.Header className="fw-bold">GraphQL Error</Card.Header>
              <Card.Body>
                <div>{`Message: ${message}`}</div>
                <div>{`Location: ${JSON.stringify(locations, null, 2)}`}</div>
                <div>{`Path: ${path}`}</div>
              </Card.Body>
            </Card>,
            {
              action,
              preventDuplicate: true,
              variant: 'error',
              autoHideDuration: 20000,
              hideIconVariant: true,
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'right',
              },
            }
          )
        })
      }

      if (
        networkError &&
        !networkError.message.includes('400') &&
        !networkError.message.includes('Failed to fetch')
      )
        enqueueSnackbar(
          <Card>
            <Card.Header className="fw-bold">Network Error</Card.Header>
            <Card.Body>
              <div>{`Message: ${networkError?.message}`}</div>
            </Card.Body>
          </Card>,
          {
            action,
            preventDuplicate: true,
            variant: 'error',
            autoHideDuration: 20000,
            hideIconVariant: true,
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'right',
            },
          }
        )
    })

    const newClient = new ApolloClient({
      link: from([retryLink, errorLink, authLink.concat(httpLink)]),
      cache: new InMemoryCache(),
      connectToDevTools: true,
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
        },
        query: {
          errorPolicy: 'all',
        },
        mutate: {
          errorPolicy: 'all',
        },
      },
    })

    setClient(newClient)
  }, [accessToken])

  if (!client) {
    return <div>Loading...</div>
  }

  return (
    <ApolloProvider client={client}>
      <SnackbarProvider>{children}</SnackbarProvider>
    </ApolloProvider>
  )
}

export default ApolloWrapper
