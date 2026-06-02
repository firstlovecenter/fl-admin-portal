import React, { useContext } from 'react'
import { MemberContext } from '../../contexts/MemberContext'
import { ChurchContext } from '../../contexts/ChurchContext'
import { isAuthorised } from '../../global-utils'
import { permitLeaderAdmin } from 'permission-utils'
import { Role } from 'global-types'
import { UnauthMsg } from 'auth/UnauthMsg'

const CampusMembers = React.lazy(
  () => import('pages/directory/grids/CampusMembers')
)
const StreamMembers = React.lazy(
  () => import('pages/directory/grids/StreamMembers')
)
const CouncilMembers = React.lazy(
  () => import('pages/directory/grids/CouncilMembers')
)
const GovernorshipMembers = React.lazy(
  () => import('pages/directory/grids/GovernorshipMembers')
)
const BacentaMembers = React.lazy(
  () => import('pages/directory/grids/BacentaMembers')
)

const MembersDirectoryRoute = ({
  children,
  roles,
}: {
  children: JSX.Element
  roles: Role[]
}) => {
  const { currentUser } = useContext(MemberContext)
  const church = useContext(ChurchContext)

  if (isAuthorised(roles, currentUser.roles)) {
    //if the user has permission to access the route
    return children
  }
  // Fallback ladder is `permitLeaderAdmin` (not `permitMe`) so arrivals
  // helpers — counters and payers — fall through to UnauthMsg. They have
  // no business in the member directory.
  if (isAuthorised(permitLeaderAdmin('Campus'), currentUser.roles)) {
    return <CampusMembers />
  }
  if (isAuthorised(permitLeaderAdmin('Stream'), currentUser.roles)) {
    return <StreamMembers />
  }
  if (isAuthorised(permitLeaderAdmin('Council'), currentUser.roles)) {
    return <CouncilMembers />
  }
  if (isAuthorised(permitLeaderAdmin('Governorship'), currentUser.roles)) {
    church.setGovernorshipId(currentUser.governorship)
    return <GovernorshipMembers />
  }
  if (isAuthorised(permitLeaderAdmin('Bacenta'), currentUser.roles)) {
    church.setBacentaId(currentUser.bacenta)
    return <BacentaMembers />
  }
  return <UnauthMsg />
}

export default MembersDirectoryRoute
