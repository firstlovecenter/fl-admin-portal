import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import InitialLoading from 'components/base-component/InitialLoading'
import { GET_LOGGED_IN_USER } from 'components/UserProfileIcon/UserQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { capitalise } from 'global-utils'
import { getUserServantRoles } from 'pages/dashboards/dashboard-utils'
import { SERVANT_CHURCH_LIST } from 'pages/dashboards/DashboardQueries'
import { permitMe } from 'permission-utils'
import { useContext, useEffect } from 'react'
import { useAuth } from 'contexts/AuthContext'
import useAuthPermissions from './useAuth'

const SetPermissions = ({
  token,
  children,
}: {
  token: string
  children: JSX.Element
}) => {
  const { currentUser, setUserJobs, setCurrentUser } = useContext(MemberContext)

  const { doNotUse } = useContext(ChurchContext)

  const { isAuthenticated, user } = useAuth()
  const { isAuthorised } = useAuthPermissions()

  console.log('🔒 SetPermissions: Initialized!', {
    currentUser,
    isAuthenticated,
    user,
    hasToken: !!token,
  })

  const { data, loading, error } = useQuery(SERVANT_CHURCH_LIST, {
    variables: { id: currentUser.id },
    skip: !currentUser.id || !isAuthenticated,
    onCompleted: (data) => {
      console.log('✅ SetPermissions: SERVANT_CHURCH_LIST completed', data)
      const servant = { ...data?.members[0], ...currentUser }
      setUserJobs(getUserServantRoles(servant))
    },
  })

  console.log('📋 SetPermissions: SERVANT_CHURCH_LIST query state', {
    loading,
    error,
    hasData: !!data,
    skip: !currentUser.id || !isAuthenticated,
  })

  const {
    data: loggedInData,
    loading: loggedInLoading,
    error: loggedInError,
  } = useQuery(GET_LOGGED_IN_USER, {
    variables: { email: user?.email },
    skip: !user?.email || !isAuthenticated,
    onCompleted: (data) => {
      console.log('✅ SetPermissions: GET_LOGGED_IN_USER completed', data)
      try {
        const streamName = data.memberByEmail.stream_name

        const denominationId =
          data.memberByEmail?.bacenta.governorship?.council.stream.campus
            ?.oversight?.denomination.id

        const oversightId =
          data.memberByEmail?.bacenta.governorship?.council.stream.campus
            ?.oversight.id
        const campusId =
          data.memberByEmail?.bacenta.governorship?.council.stream.campus?.id
        const campus =
          data.memberByEmail?.bacenta.governorship?.council?.stream.campus
        const streamId =
          data.memberByEmail?.bacenta.governorship?.council.stream.id
        const councilId = data.memberByEmail?.bacenta.governorship?.council.id
        const governorshipId = data.memberByEmail?.bacenta.governorship?.id
        const hubId = data.memberByEmail?.fellowship?.hub?.id

        const hubCouncilId = data.memberByEmail?.fellowship?.hub?.hubCouncil.id
        const ministryId =
          data.memberByEmail?.fellowship?.hub?.hubCouncil?.ministry.id
        const creativeArtsId =
          data.memberByEmail?.fellowship?.hub?.hubCouncil?.ministry
            ?.creativeArts.id
        doNotUse.setDenominationId(
          sessionStorage.getItem('denominationId') ?? denominationId
        )
        doNotUse.setOversightId(
          sessionStorage.getItem('oversightId') ?? oversightId
        )
        doNotUse.setCampusId(sessionStorage.getItem('campusId') ?? campusId)
        doNotUse.setStreamId(sessionStorage.getItem('streamId') ?? streamId)
        doNotUse.setCouncilId(sessionStorage.getItem('councilId') ?? councilId)
        doNotUse.setGovernorshipId(
          sessionStorage.getItem('governorshipId') ?? governorshipId
        )
        doNotUse.setHubId(sessionStorage.getItem('hubId') ?? hubId)
        doNotUse.setHubCouncilId(
          sessionStorage.getItem('hubCouncilId') ?? hubCouncilId
        )
        doNotUse.setMinistryId(
          sessionStorage.getItem('ministryId') ?? ministryId
        )
        doNotUse.setCreativeArtsId(
          sessionStorage.getItem('creativeArtsId') ?? creativeArtsId
        )

        setCurrentUser({
          ...currentUser,
          id: data.memberByEmail.id,
          nameWithTitle: data.memberByEmail.nameWithTitle,

          // Bacenta Levels
          bacenta: data.memberByEmail?.bacenta.id,
          governorship: governorshipId,
          council: councilId,
          stream: streamId,
          campus: campusId,
          oversight: oversightId,
          denomination: denominationId,

          // Creative Arts
          hub: hubId,
          hubCouncil: hubCouncilId,
          ministry: ministryId,
          creativeArts: creativeArtsId,

          // Other Details
          doNotUse: { doNotUse: streamName, subdoNotUse: 'bacenta' },
          stream_name: capitalise(data?.memberByEmail?.stream_name),
          noIncomeTracking: campus?.noIncomeTracking,
          currency: campus?.currency,
          conversionRateToDollar: campus?.conversionRateToDollar,
        })

        doNotUse.setChurch(currentUser.church)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('🚀 ~ file: SetPermissions.tsx ~ error', error)
      } finally {
        sessionStorage.setItem(
          'currentUser',
          JSON.stringify({ ...currentUser })
        )
      }
    },
  })

  useEffect(() => {
    doNotUse.setDenominationId(currentUser.denomination)

    if (isAuthenticated && currentUser.roles.length) {
      if (!isAuthorised(permitMe('Oversight'))) {
        doNotUse.setOversightId(currentUser.oversight)

        if (!isAuthorised(permitMe('Campus'))) {
          doNotUse.setCampusId(currentUser.campus)
          //if User is not a federal admin

          if (!isAuthorised(permitMe('Stream'))) {
            doNotUse.setChurch(currentUser.church)
            doNotUse.setStreamId(currentUser.stream)
            //User is not at the Stream Level
            if (!isAuthorised(permitMe('Council'))) {
              doNotUse.setCouncilId(currentUser.council)
              //User is not at the Council Level

              if (!isAuthorised(permitMe('Governorship'))) {
                //User is not a Governorship Admin the he can only be looking at his bacenta membership
                doNotUse.setGovernorshipId(currentUser.governorship)
                // doNotUse.setBacentaId(currentUser.bacenta)
                // if (!isAuthorised(['leaderBacenta'])) {
                //   //User is not a Bacenta Leader and he can only be looking at his fellowship membership
                // doNotUse.setFellowshipId(currentUser.fellowship?.id)
                // }
              }
            }
          }
        }
      }
    }
  }, [isAuthenticated, currentUser, isAuthorised, doNotUse])

  console.log('🎬 SetPermissions: Render decision', {
    loggedInLoading,
    loading,
    hasToken: !!token,
    willShowLoading: loggedInLoading || !token,
    hasData: !!data,
    hasLoggedInData: !!loggedInData,
  })

  // Show loading while getting member data or if no token
  if (loggedInLoading || !token) {
    console.log(
      '⏳ SetPermissions: Showing InitialLoading (fetching member by email)'
    )
    return <InitialLoading text={'Retrieving your church information...'} />
  }

  console.log('✅ SetPermissions: Rendering children with ApolloWrapper')
  return (
    <ApolloWrapper
      data={data || loggedInData}
      loading={loading}
      error={error || loggedInError}
    >
      {children}
    </ApolloWrapper>
  )
}

export default SetPermissions
