import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '../../../components/members-grids/MembersGrid'
import { GET_GATHERING_SERVICE_MEMBERS } from './GridQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'

const GatheringServiceMembers = () => {
  const { gatheringServiceId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_GATHERING_SERVICE_MEMBERS, {
    variables: { id: gatheringServiceId },
  })

  return (
    <MembersGrid
      title={data ? `${data?.gatheringServices[0]?.name}` : null}
      data={data && data.gatheringServices[0].members}
      loading={loading}
      error={error}
    />
  )
}

export default GatheringServiceMembers
