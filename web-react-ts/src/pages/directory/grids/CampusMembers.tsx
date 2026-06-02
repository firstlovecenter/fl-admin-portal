import React, { useContext } from 'react'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_CAMPUS_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

const CampusMembers = () => {
  const { campusId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_CAMPUS_MEMBERS}
      parentId={campusId}
      parentTypename="Campus"
      pluckParent={(data) => data?.campuses?.[0]}
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

export default CampusMembers
