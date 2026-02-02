import React, { lazy, useContext } from 'react'

import { UnauthMsg } from './UnauthMsg'
import { MemberContext } from '../contexts/MemberContext'
import { isAuthorised } from '../global-utils'
import { Role } from 'global-types'

type ProtectedRouteHomeProps = {
  component: React.ReactNode
  roles: Role[]
}
const UserDashboard = lazy(() => import('pages/dashboards/UserDashboard'))

const ProtectedRouteHome = ({
  component,
  roles,
  ...args
}: ProtectedRouteHomeProps) => {
  const { currentUser, setMemberId } = useContext(MemberContext)

  if (isAuthorised(roles, currentUser.roles)) {
    //if the user has permission to access the route
    return <>{component}</>
  } else if (
    isAuthorised(
      [
        'adminCouncil',
        'adminGovernorship',
        'leaderGovernorship',
        'leaderBacenta',
        'leaderFellowship',
      ],
      currentUser.roles
    )
  ) {
    setMemberId(currentUser.id)
    //If the user does not have permission but is a CO Admin
    return <UserDashboard />
  } else {
    return <UnauthMsg />
  }
}

export default ProtectedRouteHome
