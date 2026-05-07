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
import SplashSreen from 'pages/splash-screen/SplashSreen'
import AppWithContext from 'AppWithContext'

const AppWithApollo = () => {
  const [accessToken, setAccessToken] = useState<string>('')
  const { getAccessTokenSilently, isLoading, user } = useAuth()

  const getAccessToken = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently()

      setAccessToken(token)
    } catch (err) {
      // Error obtaining token silently
    }
  }, [getAccessTokenSilently])

  useEffect(() => {
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

  if (isLoading) {
    return <SplashSreen />
  }

  return (
    <ApolloProvider client={client}>
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
