import React, { useContext } from 'react'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_COUNCIL_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

const CouncilMembers = () => {
  const { councilId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_COUNCIL_MEMBERS}
      parentId={councilId}
      parentTypename="Council"
      pluckParent={(data) => data?.councils?.[0]}
      getHeading={(parent) => (parent ? `${parent.name} Council` : null)}
    />
  )
}

export default CouncilMembers
