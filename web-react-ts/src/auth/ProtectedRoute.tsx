import React, { useContext } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { MemberContext } from '../contexts/MemberContext'
import { ChurchContext } from '../contexts/ChurchContext'
import { isAuthorised } from '../global-utils'
import { permitMe } from 'permission-utils'
import { UnauthMsg } from './UnauthMsg'
import LoadingScreen from 'components/base-component/LoadingScreen'
import Login from 'components/Login'
import { Role } from 'global-types'

type ProtectedRouteProps = {
  children: JSX.Element
  roles: Role[]
  roleBased?: boolean
  placeholder?: boolean
}

const ProtectedRoute: (props: ProtectedRouteProps) => JSX.Element = (props) => {
  const { children, roles, roleBased, placeholder } = props
  const { currentUser } = useContext(MemberContext)
  const { isAuthenticated, isLoading } = useAuth0()
  const church = useContext(ChurchContext)

  const atHome = location?.pathname === '/'

  if (
    isLoading ||
    //Not Authenticated means that Authentication is still happening
    !isAuthenticated ||
    !currentUser.roles.length
  ) {
    return <LoadingScreen />
  }
  if (atHome && !isAuthenticated) {
    //Unauthenticated and home
    return <Login />
  }

  if (isAuthorised(roles, currentUser.roles)) {
    //if the user has permission to access the initialTouchedroute
    return children
  } else if (
    (placeholder && !isAuthenticated) ||
    (placeholder && !isAuthenticated && roleBased)
  ) {
    //User has no permission but there is a placeholder, and he's authenticated so let's load the screen
    if (isAuthorised(permitMe('Bacenta'), currentUser.roles)) {
      //If the user does not have permission but is a Bacenta Leader
      church.setBacentaId(currentUser.bacenta)
    } else if (isAuthorised(permitMe('Governorship'), currentUser.roles)) {
      //If the user does not have permission but is a Governorship Leader
      church.setGovernorshipId(currentUser.governorship)
    } else if (isAuthorised(permitMe('Council'), currentUser.roles)) {
      //If the user does not have permission but is a Council Leader
      church.setCouncilId(currentUser.council)
    } else if (isAuthorised(permitMe('Stream'), currentUser.roles)) {
      //If the user does not have permission but is a Stream Leader
      church.setStreamId(currentUser.stream)
    } else if (isAuthorised(permitMe('Campus'), currentUser.roles)) {
      //If the user does not have permission but is a Campus Leader
      church.setCampusId(currentUser.campus)
    }

    return children
  } else {
    //Authenticated but not allowed to view
    return <UnauthMsg />
  }
}

export default ProtectedRoute
