import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '@/components/members-grids/MembersGrid'
import { GET_COUNCIL_MEMBERS } from './GridQueries'
import { ChurchContext } from '@/contexts/ChurchContext'
// import TabletDesktopView from 'components/responsive-design/TabletDesktopView'

const CouncilMembers = () => {
  const { councilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_COUNCIL_MEMBERS, {
    variables: { id: councilId },
  })

  return (
    <MembersGrid
      title={data ? `${data?.councils[0]?.name} Council` : null}
      data={data && data.councils[0].members}
      loading={loading}
      error={error}
    />
  )
}

export default CouncilMembers
