'use client'

import React, { Suspense, useState } from 'react'
import { MemberContext, SearchContext } from './contexts/MemberContext'
import { ChurchContext } from './contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import SetPermissions from 'auth/SetPermissions'
import useClickCard from 'hooks/useClickCard'
import { useAuth0 } from '@auth0/auth0-react'
import LoadingScreen from 'components/base-component/LoadingScreen'
import PageContainer from 'components/base-component/PageContainer'
import Navigation from 'pages/dashboards/Navigation'

type AppPropsType = {
  token: string
  children?: React.ReactNode
}

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
    typeof window !== 'undefined' && sessionStorage.getItem('currentUser')
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

  return (
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
                  <PageContainer>{props.children || <></>}</PageContainer>
                </Suspense>
              </>
            </SetPermissions>
          </ServiceContext.Provider>
        </SearchContext.Provider>
      </MemberContext.Provider>
    </ChurchContext.Provider>
  )
}

export default AppWithContext
