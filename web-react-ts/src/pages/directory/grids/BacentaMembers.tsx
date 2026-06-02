import React, { useContext } from 'react'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_BACENTA_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

const BacentaMembers = () => {
  const { bacentaId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_BACENTA_MEMBERS}
      parentId={bacentaId}
      parentTypename="Bacenta"
      pluckParent={(data) => data?.bacentas?.[0]}
      getHeading={(parent) =>
        parent ? (
          <>
            {parent.name}{' '}
            <span className="text-members">Bacenta</span>
          </>
        ) : null
      }
    />
  )
}

export default BacentaMembers
