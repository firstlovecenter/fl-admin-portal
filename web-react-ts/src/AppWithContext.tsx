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
import { useAuth0 } from '@auth0/auth0-react'
import LoadingScreen from 'components/base-component/LoadingScreen'
import * as Sentry from '@sentry/react'
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

  const { user } = useAuth0()

  const [currentUser, setCurrentUser] = useState(
    sessionStorage.getItem('currentUser')
      ? JSON.parse(sessionStorage.getItem('currentUser') || '{}')
      : {
          __typename: 'Member',
          id: user?.sub?.replace('auth0|', ''),
          firstName: user?.given_name,
          lastName: user?.family_name,
          fullName: user?.name,
          picture: user?.picture,
          email: user?.email,
          roles: user && user[`https://flcadmin.netlify.app/roles`],
        }
  )

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

  const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes)

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
                  <Navigation />
                  <Suspense fallback={<LoadingScreen />}>
                    <PageContainer>
                      <SentryRoutes>
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
                      </SentryRoutes>
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
