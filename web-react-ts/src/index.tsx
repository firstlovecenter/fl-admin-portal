import React, { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RetryLink } from '@apollo/client/link/retry'
import { onError } from '@apollo/client/link/error'
import {
  ApolloClient,
  // ApolloProvider,
  createHttpLink,
  from,
  InMemoryCache,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import CacheBuster from 'CacheBuster'

import 'bootstrap/dist/css/bootstrap.min.css'
import './color-theme.css'
import './index.css'
// import AppWithContext from 'AppWithContext'
// import Login from 'components/Login'
import ReactGA from 'react-ga4'
// import SplashSreen from 'pages/splash-screen/SplashSreen'
import * as Sentry from '@sentry/react'
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom'
import { BrowserTracing } from '@sentry/tracing'
import {
  SnackbarKey,
  // SnackbarProvider,
  closeSnackbar,
  enqueueSnackbar,
} from 'notistack'
import { Button, Card, Container } from 'react-bootstrap'
import MaintenanceMode from 'auth/MaintenanceMode'

const AppWithApollo = () => {
  const [accessToken, setAccessToken] = useState<string>('')
  // const { getAccessTokenSilently, isLoading, user } = useAuth0()
  const { getAccessTokenSilently } = useAuth0()

  const getAccessToken = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently({
        audience: 'https://flcadmin.netlify.app/graphql',
        scope: 'read:current_user',
      })

      setAccessToken(token)
      sessionStorage.setItem('token', token)
    } catch (err) {
      // eslint-disable-next-line
      console.error('Error Obtaining Token', err)
    }
  }, [getAccessTokenSilently])

  useEffect(() => {
    getAccessToken()
  }, [getAccessToken])

  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URI || '/graphql',
  })

  const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = sessionStorage.getItem('token') || accessToken

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
    uri: import.meta.env.VITE_GRAPHQL_URI || '/graphql',
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

  if (true) {
    return (
      <Container>
        <MaintenanceMode />
      </Container>
    )
  }

  // if (isLoading) {
  //   return <SplashSreen />
  // }

  // if (!user) {
  //   return <Login />
  // }

  // return (
  //   <ApolloProvider client={client}>
  //     <SnackbarProvider />
  //     <AppWithContext token={accessToken} />
  //   </ApolloProvider>
  // )
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
        <Auth0Provider
          domain={import.meta.env.VITE_AUTH0_DOMAIN || ''}
          clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || ''}
          redirectUri={window.location.origin}
          audience="https://flcadmin.netlify.app/graphql"
          scope="true"
        >
          <AppWithApollo />
        </Auth0Provider>
      )
    }}
  </CacheBuster>
)

ReactGA.initialize('G-BT4M7RYZX0')
ReactGA.send('pageview')

const container: HTMLElement =
  document.getElementById('root') || document.createElement('div')
const root = createRoot(container)

Sentry.init({
  dsn: 'https://a6fccd390f7a4cdfa48da901b0e2e22f@o1423098.ingest.sentry.io/6770463',

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay(),
    new BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        // @ts-ignore
        matchRoutes
      ),
    }),
  ],
  beforeSend(event) {
    if (event.exception) {
      sessionStorage.setItem('lastEventId', event.event_id ?? '')
    }
    return event
  },

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
})

root.render(
  <React.StrictMode>
    <AppWithAuth />
  </React.StrictMode>
)
