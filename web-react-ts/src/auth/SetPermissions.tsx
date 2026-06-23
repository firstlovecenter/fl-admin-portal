import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import InitialLoading from 'components/base-component/InitialLoading'
import { GET_LOGGED_IN_USER } from 'components/UserProfileIcon/UserQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { capitalise, throwToSentry } from 'global-utils'
import { getUserServantRoles } from 'pages/dashboards/dashboard-utils'
import { permitMe } from 'permission-utils'
import { useContext, useEffect } from 'react'
import { useAuth } from 'contexts/AuthContext'
import useAuthPermissions from './useAuth'
import { useLocation } from 'react-router-dom'
import { isPublicAuthRoute } from 'lib/auth-service'

const SetPermissions = ({ children }: { children: JSX.Element }) => {
  const { currentUser, setUserJobs, setCurrentUser } = useContext(MemberContext)
  const { doNotUse } = useContext(ChurchContext)
  const { isAuthenticated, user } = useAuth()
  const { isAuthorised } = useAuthPermissions()
  const location = useLocation()

  const isPublicRoute = isPublicAuthRoute(location.pathname)

  const {
    data: loggedInData,
    loading: loggedInLoading,
    error: loggedInError,
  } = useQuery(GET_LOGGED_IN_USER, {
    variables: { email: user?.email },
    skip: !user?.email || !isAuthenticated,
    onCompleted: (data) => {
      try {
        const memberData = data.memberByEmail
        const streamName = memberData.stream_name
        const memberPicture = memberData?.pictureUrl || ''

        // Specialist roles (e.g. tellerStream) may have no home bacenta —
        // the user is a Member who only carries an IS_TELLER_FOR edge to a
        // Stream. Chain every step so the null-bacenta case doesn't throw
        // before we ever populate `currentUser` / `userJobs`. For tellers
        // we fall back to `isTellerForStream[0].id` as the streamId so the
        // confirm-banking page reads the right stream from ChurchContext.
        const denominationId =
          memberData?.bacenta?.governorship?.council?.stream?.campus?.oversight
            ?.denomination?.id

        const oversightId =
          memberData?.bacenta?.governorship?.council?.stream?.campus?.oversight
            ?.id
        const campusId =
          memberData?.bacenta?.governorship?.council?.stream?.campus?.id
        const campus = memberData?.bacenta?.governorship?.council?.stream?.campus
        const tellerStreamFallback = memberData?.isTellerForStream?.[0]
        const streamId =
          memberData?.bacenta?.governorship?.council?.stream?.id ??
          tellerStreamFallback?.id
        const councilId = memberData?.bacenta?.governorship?.council?.id
        const governorshipId = memberData?.bacenta?.governorship?.id

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

        const nextCurrentUser = {
          ...currentUser,
          // SYN-175: roles are authoritative only from the signed access token
          // (surfaced as AuthContext `user.roles`). Set them explicitly so the
          // `...currentUser` spread can never reintroduce stale/tampered roles.
          // The `currentUser.roles` arm is only a transient pre-auth fallback
          // (it is itself token-synced by the AppWithContext effect) — it is
          // never a trusted source; `user.roles` is set before this query
          // resolves, so it wins in practice.
          roles: user?.roles ?? currentUser.roles ?? [],
          id: memberData.id,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          fullName: memberData.fullName,
          picture: memberPicture,
          pictureUrl: memberPicture,
          nameWithTitle: memberData.nameWithTitle,

          // Bacenta Levels
          bacenta: memberData?.bacenta?.id,
          governorship: governorshipId,
          council: councilId,
          stream: streamId,
          campus: campusId,
          oversight: oversightId,
          denomination: denominationId,

          // Other Details
          church: { church: streamName, subChurch: 'bacenta' },
          stream_name: capitalise(memberData?.stream_name),
          noIncomeTracking: campus?.noIncomeTracking,
          currency: campus?.currency,
          conversionRateToDollar: campus?.conversionRateToDollar,

          // Per-instance authority — `myAuthority` returns the user's
          // servant trees + flat allowed id list, computed once on the BE
          // from their Neo4j servant edges. Drives `useCan` and
          // `useCanViewChurch` everywhere else. Without this, action gates
          // fall back to coarse roles only, re-opening the David Dag
          // Vanderpuije breadcrumb-spine-walk class of exploit.
          authority: data?.myAuthority
            ? {
                servantTrees: data.myAuthority.servantTrees ?? [],
                allowedChurchIds: data.myAuthority.allowedChurchIds ?? [],
              }
            : undefined,
        }

        setCurrentUser(nextCurrentUser)

        // Set user jobs using servant role data from memberByEmail
        const servant = { ...memberData, ...nextCurrentUser }
        setUserJobs(getUserServantRoles(servant))

        const churchValue = { church: streamName, subChurch: 'bacenta' }
        doNotUse.setChurch(churchValue)
        sessionStorage.setItem('church', JSON.stringify(churchValue))

        sessionStorage.setItem('currentUser', JSON.stringify(nextCurrentUser))
      } catch (error) {
        throwToSentry('Error setting user permissions', error)
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
              }
            }
          }
        }
      }
    }
  }, [isAuthenticated, currentUser, isAuthorised, doNotUse])

  // For public auth routes, skip authentication requirement and render immediately without Apollo wrapper
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Show loading while fetching member data, or while we're still unauthenticated
  // (token rotation in flight) on a protected route.
  if (loggedInLoading || !isAuthenticated) {
    return <InitialLoading text={'Retrieving your church information...'} />
  }

  return (
    <ApolloWrapper
      data={loggedInData}
      loading={loggedInLoading}
      error={loggedInError}
    >
      {children}
    </ApolloWrapper>
  )
}

export default SetPermissions
