import React, { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RetryLink } from '@apollo/client/link/retry'
import { onError } from '@apollo/client/link/error'
import {
  ApolloClient,
  ApolloProvider,
  // ApolloProvider,
  createHttpLink,
  from,
  InMemoryCache,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import CacheBuster from 'CacheBuster'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import SimpleApp from './SimpleApp'

import 'bootstrap/dist/css/bootstrap.min.css'
import './color-theme.css'
import './index.css'
import ReactGA from 'react-ga4'
import {
  SnackbarKey,
  SnackbarProvider,
  closeSnackbar,
  enqueueSnackbar,
} from 'notistack'
import { Button, Card } from 'react-bootstrap'
import SplashSreen from 'pages/splash-screen/SplashSreen'
import AppWithContext from 'AppWithContext'

const AppWithApollo = () => {
  const [accessToken, setAccessToken] = useState<string>('')
  const { getAccessTokenSilently, isLoading, user } = useAuth()

  const getAccessToken = useCallback(async () => {
    try {
      console.log('🎫 AppWithApollo: Fetching access token...')
      const token = await getAccessTokenSilently()

      setAccessToken(token)
      sessionStorage.setItem('token', token)
    } catch (err) {
      // eslint-disable-next-line
      console.error('❌ Error Obtaining Token', err)
    }
  }, [getAccessTokenSilently])

  useEffect(() => {
    console.log(
      '🚀 AppWithApollo: Initializing, isLoading:',
      isLoading,
      'user:',
      user
    )
    if (!isLoading && user) {
      getAccessToken()
    }
  }, [getAccessToken, isLoading, user])

  const httpLink = createHttpLink({
    uri:
      import.meta.env.VITE_SYNAGO_GRAPHQL_URI ||
      'http://localhost:4001/graphql',
  })

  const authLink = setContext((_, { headers }) => {
    // get the authentication token from memory or localStorage
    const token = accessToken

    // return the headers to the context so httpLink can read them
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
            {/* <div>{`Stack: ${JSON.stringify(networkError?.stack)}`}</div> */}
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

  const errorPolicy = 'all'

  const client = new ApolloClient({
    uri: import.meta.env.VITE_SYNAGO_GRAPHQL_URI || '/graphql',
    link: from([retryLink, errorLink, authLink.concat(httpLink)]),
    cache: new InMemoryCache(),
    connectToDevTools: true,
    defaultOptions: {
      watchQuery: {
        errorPolicy: errorPolicy,
      },
      query: {
        errorPolicy: errorPolicy,
      },
      mutate: {
        errorPolicy: errorPolicy,
      },
    },
  })

  // if (new Date().getDay() === 1 && new Date().getHours() > 4) {
  //   return <Sabbath />
  // }

  // if (true) {
  //   return (
  //     <Container>
  //       <MaintenanceMode />
  //     </Container>
  //   )
  // }

  if (isLoading) {
    console.log('⏳ AppWithApollo: Auth still loading...')
    return <SplashSreen />
  }

  console.log(
    '🎨 AppWithApollo: Rendering main app, user:',
    user,
    'accessToken:',
    accessToken?.substring(0, 20)
  )
  return (
    <ApolloProvider client={client}>
      <SnackbarProvider />
      <AppWithContext token={accessToken} />
    </ApolloProvider>
  )
}

const AppWithAuth = () => (
  <CacheBuster>
    {({
      loading,
      isLatestVersion,
      refreshCacheAndReload,
    }: {
      loading: boolean
      isLatestVersion: boolean
      refreshCacheAndReload: () => void
    }) => {
      if (loading) return null
      if (!loading && !isLatestVersion) {
        refreshCacheAndReload()
      }

      return (
        <AuthProvider>
          <AppWithApollo />
        </AuthProvider>
      )
    }}
  </CacheBuster>
)

ReactGA.initialize('G-BT4M7RYZX0')
ReactGA.send('pageview')

const container: HTMLElement =
  document.getElementById('root') || document.createElement('div')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <SimpleApp>
      <AppWithAuth />
    </SimpleApp>
  </React.StrictMode>
)
