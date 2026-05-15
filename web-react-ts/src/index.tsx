import React from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloProvider } from '@apollo/client'
import CacheBuster from 'CacheBuster'
import { createApolloClient } from 'lib/createApolloClient'
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
import AppWithContext from 'AppWithContext'

const AppWithApollo = () => {
  const { getAccessTokenSilently } = useAuth()

  // Behaviour preserved from the pre-SYN-79 inline construction: the client
  // is rebuilt on every render. createApolloClient closes over
  // getAccessTokenSilently so token rotation (refresh / logout) is picked up
  // per-request through the closure.
  const client = createApolloClient({ getAccessTokenSilently })

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
