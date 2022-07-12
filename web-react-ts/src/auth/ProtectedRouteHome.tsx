import React, { useContext } from 'react'
import { Route } from 'react-router-dom'
import { UnauthMsg } from './UnauthMsg'
import { MemberContext } from '../contexts/MemberContext'
import { isAuthorised } from '../global-utils'
import UserDashboard from 'pages/dashboards/UserDashboard'
import { Role } from 'global-types'

type ProtectedRouteHomeProps = {
  component: React.ReactNode
  roles: Role[]
}

const ProtectedRouteHome = ({
  component,
  roles,
  ...args
}: ProtectedRouteHomeProps) => {
  const { currentUser, setMemberId } = useContext(MemberContext)

  if (isAuthorised(roles, currentUser.roles)) {
    //if the user has permission to access the route
    return <Route element={component} {...args} />
  } else if (
    isAuthorised(
      [
        'adminCouncil',
        'adminConstituency',
        'leaderConstituency',
        'leaderBacenta',
        'leaderSonta',
        'leaderFellowship',
      ],
      currentUser.roles
    )
  ) {
    setMemberId(currentUser.id)
    //If the user does not have permission but is a CO Admin
    return <Route element={<UserDashboard />} {...args} />
  } else {
    return <UnauthMsg />
  }
}

export default ProtectedRouteHome
