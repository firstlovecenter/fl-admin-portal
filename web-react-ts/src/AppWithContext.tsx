import React, { Suspense, useState } from 'react'
import { Routes, BrowserRouter as Router, Route } from 'react-router-dom'
import { MemberContext, SearchContext } from './contexts/MemberContext'
import { ChurchContext } from './contexts/ChurchContext'
import ProtectedRoute from './auth/ProtectedRoute'
import ProtectedRouteHome from './auth/ProtectedRouteHome'
import ServantsChurchList from 'pages/dashboards/ServantsChurchList'
import { ServiceContext } from 'contexts/ServiceContext'
import MembersDirectoryRoute from './pages/directory/MembersDirectoryRoute'
import Navigation from 'pages/dashboards/Navigation'
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
import LoginPage from 'pages/auth/LoginPage'
import ForgotPasswordPage from 'pages/auth/ForgotPasswordPage'
import { maps } from 'pages/maps/mapsRoutes'
import PageContainer from 'components/base-component/PageContainer'
import { accountsRoutes } from 'pages/accounts/accountsRoutes'

type AppPropsType = {
  token: string
}

const ServantsDashboard = React.lazy(
  () => import('pages/dashboards/ServantsDashboard')
)

const AppWithContext = (props: AppPropsType) => {
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
    fellowshipId,
    hubId,
    hubCouncilId,
    ministryId,
    creativeArtsId,
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
    setHubId,
    setHubCouncilId,
    setMinistryId,
    setCreativeArtsId,
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
    setHubId,
    setHubCouncilId,
    setMinistryId,
    setCreativeArtsId,
  }

  const { user } = useAuth()

  const [currentUser, setCurrentUser] = useState(
    sessionStorage.getItem('currentUser')
      ? JSON.parse(sessionStorage.getItem('currentUser') || '{}')
      : {
          __typename: 'Member',
          id: user?.id || '',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          picture: '',
          email: user?.email || '',
          roles: user?.roles || [],
        }
  )

  console.log('🏠 AppWithContext: Initialized', {
    user,
    currentUser,
    hasSessionUser: !!sessionStorage.getItem('currentUser'),
    token: props.token?.substring(0, 20),
  })

  const [userJobs, setUserJobs] = useState()

  const [searchKey, setSearchKey] = useState('')
  const [filters, setFilters] = useState({
    gender: [],
    maritalStatus: [],
    occupation: '',
    leaderTitle: [],
    leaderRank: [],
    basonta: [],
  })

  return (
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
          fellowshipId,
          hubId,
          hubCouncilId,
          ministryId,
          creativeArtsId,
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
          <SearchContext.Provider value={{ searchKey, setSearchKey }}>
            <ServiceContext.Provider
              value={{
                serviceRecordId,
                bussingRecordId,
                vehicleRecordId,
                multiplicationRecordId,
              }}
            >
              <SetPermissions token={props.token}>
                <>
                  {user && <Navigation />}
                  <Suspense fallback={<LoadingScreen />}>
                    <PageContainer>
                      <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                          path="/forgot-password"
                          element={<ForgotPasswordPage />}
                        />
                        {[
                          ...dashboards,
                          ...directory,
                          ...services,
                          ...arrivals,
                          ...reconciliation,
                          ...graphs,
                          ...maps,
                          ...accountsRoutes,
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
                      </Routes>
                    </PageContainer>
                  </Suspense>
                </>
              </SetPermissions>
            </ServiceContext.Provider>
          </SearchContext.Provider>
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </Router>
  )
}

export default AppWithContext
