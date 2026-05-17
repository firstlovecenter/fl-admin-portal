import React, { useContext } from 'react'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_OVERSIGHT_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

const OversightMembers = () => {
  const { oversightId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_OVERSIGHT_MEMBERS}
      parentId={oversightId}
      parentTypename="Oversight"
      pluckParent={(data) => data?.oversights?.[0]}
      getHeading={(parent) =>
        parent ? (
          <>
            {parent.name}{' '}
            <span className="text-members">Members</span>
          </>
        ) : null
      }
    />
  )
}

export default OversightMembers
