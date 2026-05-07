import React, { Suspense, useContext, useState } from 'react'
import {
  Routes,
  BrowserRouter as Router,
  Route,
  Outlet,
} from 'react-router-dom'
import { MemberContext } from './contexts/MemberContext'
import { AppShell } from 'components/shell/AppShell'
import { ChurchContext } from './contexts/ChurchContext'
import ProtectedRoute from './auth/ProtectedRoute'
import ProtectedRouteHome from './auth/ProtectedRouteHome'
import ServantsChurchList from 'pages/dashboards/ServantsChurchList'
import { ServiceContext } from 'contexts/ServiceContext'
import MembersDirectoryRoute from './pages/directory/MembersDirectoryRoute'
import { dashboards } from 'pages/dashboards/dashboardRoutes'
import {
  directory,
  memberDirectory,
  memberGrids,
  quickFacts,
} from 'pages/directory/directoryRoutes'
import { graphs, services } from 'pages/services/servicesRoutes'
import { arrivals } from 'pages/arrivals/arrivalsRoutes'
import { reconciliation } from 'pages/reconciliation/reconRoutes'
import PageNotFound from 'pages/page-not-found/PageNotFound'
import SetPermissions from 'auth/SetPermissions'
import { permitMe } from 'permission-utils'
import useClickCard from 'hooks/useClickCard'
import { useAuth } from 'contexts/AuthContext'
import LoadingScreen from 'components/base-component/LoadingScreen'
import SetupPasswordPage from 'pages/auth/SetupPasswordPage'
import { maps } from 'pages/maps/mapsRoutes'
import { accountsRoutes } from 'pages/accounts/accountsRoutes'
import { aiAssistant } from 'pages/ai-assistant/aiAssistantRoutes'
import { shepherdingControl } from 'pages/shepherding-control/shepherdingControlRoutes'
import { settings } from 'pages/settings/settingsRoutes'
import { reportsRoutes } from 'pages/reports/reportsRoutes'
import { ThemeProvider } from 'components/shell/ThemeProvider'
import { Toaster } from 'components/ui/sonner'
import { ChurchRoleScopeProvider } from 'contexts/ChurchRoleScopeContext'

const ServantsDashboard = React.lazy(
  () => import('pages/dashboards/ServantsDashboard')
)

const ShellLayout = () => {
  const { currentUser } = useContext(MemberContext)
  return (
    <AppShell
      userName={currentUser?.fullName}
      userImageUrl={currentUser?.picture || currentUser?.pictureUrl}
    >
      {/* Suspense lives INSIDE the shell so lazy route transitions
          don't unmount the sidebar — only the page content swaps. */}
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    </AppShell>
  )
}

const getInitialCurrentUser = (
  user?: {
    id?: string
    firstName?: string
    lastName?: string
    email?: string
    roles?: string[]
  } | null
) => {
  const fallbackUser = {
    __typename: 'Member',
    id: user?.id || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    picture: '',
    pictureUrl: '',
    email: user?.email || '',
    roles: user?.roles || [],
  }

  const storedCurrentUser = sessionStorage.getItem('currentUser')

  if (!storedCurrentUser) {
    return fallbackUser
  }

  try {
    return JSON.parse(storedCurrentUser)
  } catch {
    return fallbackUser
  }
}

const AppWithContext = () => {
  const {
    clickCard,
    church,
    memberId,
    denominationId,
    oversightId,
    campusId,
    streamId,
    councilId,
    governorshipId,
    bacentaId,
    bussingRecordId,
    serviceRecordId,
    vehicleRecordId,

    multiplicationRecordId,
    arrivalDate,
    transactionId,

    //Set State
    setDenominationId,
    setOversightId,
    setCampusId,
    setChurch,
    setStreamId,
    setCouncilId,
    setGovernorshipId,
    setArrivalDate,
  } = useClickCard()

  const doNotUse = {
    setDenominationId,
    setOversightId,
    setCampusId,
    setChurch,
    setStreamId,
    setCouncilId,
    setGovernorshipId,
  }

  const { user } = useAuth()

  const [currentUser, setCurrentUser] = useState(() =>
    getInitialCurrentUser(user)
  )

  const [userJobs, setUserJobs] = useState()

  const [filters, setFilters] = useState({
    gender: [],
    maritalStatus: [],
    occupation: '',
    leaderTitle: [],
    leaderRank: [],
    basonta: [],
  })

  return (
    <ThemeProvider>
      <Toaster />
      <Router>
        <ChurchContext.Provider
          value={{
            clickCard,
            filters,
            setFilters,
            church,
            memberId,
            campusId,
            streamId,
            councilId,
            governorshipId,
            bacentaId,
            oversightId,
            denominationId,
            doNotUse,
            arrivalDate,
            setArrivalDate,
            transactionId,
          }}
        >
          <MemberContext.Provider
            value={{
              memberId,
              currentUser,
              setCurrentUser,
              userJobs,
              setUserJobs,
            }}
          >
            <ChurchRoleScopeProvider>
              <ServiceContext.Provider
                value={{
                  serviceRecordId,
                  bussingRecordId,
                  vehicleRecordId,
                  multiplicationRecordId,
                }}
              >
                <SetPermissions>
                  <Routes>
                    <Route
                      path="/setup-password"
                      element={<SetupPasswordPage />}
                    />
                    <Route element={<ShellLayout />}>
                      {[
                        ...dashboards,
                        ...directory,
                        ...services,
                        ...arrivals,
                        ...reconciliation,
                        ...graphs,
                        ...maps,
                        ...accountsRoutes,
                        ...aiAssistant,
                        ...shepherdingControl,
                        ...settings,
                        ...reportsRoutes,
                      ].map((route, i) => (
                        <Route
                          key={i}
                          path={route.path}
                          element={
                            <ProtectedRoute
                              roles={route.roles ?? ['all']}
                              placeholder={route.placeholder}
                            >
                              <route.element />
                            </ProtectedRoute>
                          }
                        />
                      ))}
                      {[
                        ...memberDirectory,
                        ...memberGrids,
                        ...quickFacts,
                      ].map((route, i) => (
                        <Route
                          key={i}
                          path={route.path}
                          element={
                            <MembersDirectoryRoute roles={route.roles}>
                              <route.element />
                            </MembersDirectoryRoute>
                          }
                        />
                      ))}

                      <Route
                        path="/dashboard/servants"
                        element={
                          <ProtectedRouteHome
                            roles={permitMe('Bacenta')}
                            component={<ServantsDashboard />}
                          />
                        }
                      />
                      <Route
                        path="/servants/church-list"
                        element={
                          <ProtectedRoute
                            roles={permitMe('Bacenta')}
                            placeholder
                          >
                            <ServantsChurchList />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<PageNotFound />} />
                    </Route>
                  </Routes>
                </SetPermissions>
              </ServiceContext.Provider>
            </ChurchRoleScopeProvider>
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </Router>
    </ThemeProvider>
  )
}

export default AppWithContext
