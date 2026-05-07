import React, { useContext } from 'react'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_GOVERNORSHIP_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

export const GovernorshipMembers = () => {
  const { governorshipId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_GOVERNORSHIP_MEMBERS}
      parentId={governorshipId}
      parentTypename="Governorship"
      pluckParent={(data) => data?.governorships?.[0]}
      getHeading={(parent) => (parent ? `${parent.name} Governorship` : null)}
      downloadConfig={
        governorshipId
          ? {
              level: 'Governorship',
              churchId: governorshipId,
            }
          : null
      }
    />
  )
}

export default GovernorshipMembers
