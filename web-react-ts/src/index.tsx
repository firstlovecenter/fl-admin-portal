import React from 'react'
import { createRoot } from 'react-dom/client'
import { RetryLink } from '@apollo/client/link/retry'
import { onError } from '@apollo/client/link/error'
import {
  ApolloClient,
  ApolloProvider,
  // ApolloProvider,
  createHttpLink,
  from,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import buildApolloCache from 'lib/apollo-cache'
import CacheBuster from 'CacheBuster'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import SimpleApp from './SimpleApp'

// Custom CSS imports temporarily disabled to evaluate the dashboard with
// only Tailwind + Shadcn driving the visuals. Keep `app.css` because it
// is the Tailwind v4 entry point (and pulls in design tokens).
// import 'bootstrap/dist/css/bootstrap.min.css'
import './app.css'
// import './color-theme.css'
// import './index.css'
import ReactGA from 'react-ga4'
import { toast } from 'sonner'
import AppWithContext from 'AppWithContext'

const AUTH_LINK_TOKEN_TIMEOUT_MS = 8000

const AppWithApollo = () => {
  const { getAccessTokenSilently } = useAuth()

  const httpLink = createHttpLink({
    uri:
      import.meta.env.VITE_SYNAGO_GRAPHQL_URI ||
      'http://localhost:4001/graphql',
  })

  const authLink = setContext(async (_, { headers }) => {
    // Pull a fresh token per-request. getAccessTokenSilently transparently
    // refreshes via the refresh token when the access token is past the
    // local expiry buffer, so outgoing queries never ship a stale Bearer.
    // Race against a timeout so a hung refresh fetch can't block every
    // in-flight request indefinitely — RetryLink only retries failures, not
    // requests stalled in the link layer.
    let token = ''
    let timerId: ReturnType<typeof setTimeout> | undefined
    try {
      token = await Promise.race([
        getAccessTokenSilently(),
        new Promise<string>((_resolve, reject) => {
          timerId = setTimeout(
            () => reject(new Error('Auth token fetch timed out')),
            AUTH_LINK_TOKEN_TIMEOUT_MS
          )
        }),
      ])
    } catch {
      // No token / refresh failed / timed out. If refresh failed for real,
      // AuthContext has already cleared the user and SimpleApp will swap to
      // the login screen; if it timed out, the request goes without auth and
      // the server will reject it.
    } finally {
      if (timerId !== undefined) clearTimeout(timerId)
    }

    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        if (message.includes('Unauthenticated')) return

        toast.error('GraphQL Error', {
          id: `gql:${message}:${path?.join('.') ?? ''}`,
          description: (
            <div className="space-y-1">
              <div>Message: {message}</div>
              <div>Location: {JSON.stringify(locations)}</div>
              <div>Path: {path?.join('.')}</div>
            </div>
          ),
          duration: 20000,
        })
      })
    }

    if (
      networkError &&
      !networkError.message.includes('400') &&
      !networkError.message.includes('Failed to fetch')
    ) {
      toast.error('Network Error', {
        id: `network:${networkError.message}`,
        description: networkError.message,
        duration: 20000,
      })
    }
  })

  const errorPolicy = 'all'

  const client = new ApolloClient({
    uri: import.meta.env.VITE_SYNAGO_GRAPHQL_URI || '/graphql',
    link: from([retryLink, errorLink, authLink.concat(httpLink)]),
    cache: buildApolloCache(),
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

  return (
    <ApolloProvider client={client}>
      <AppWithContext />
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
          <SimpleApp>
            <AppWithApollo />
          </SimpleApp>
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
    <AppWithAuth />
  </React.StrictMode>
)
