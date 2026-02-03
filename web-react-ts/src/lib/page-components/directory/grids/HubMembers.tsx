import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '@/components/members-grids/MembersGrid'
import { GET_HUB_MEMBERS } from './GridQueries'
import { ChurchContext } from '@/contexts/ChurchContext'

const HubMembers = () => {
  const { hubId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_HUB_MEMBERS, {
    variables: { id: hubId },
  })

  return (
    <MembersGrid
      title={data ? `${data.hubs[0]?.name} Hub` : null}
      data={data?.hubs[0]?.members}
      loading={loading}
      error={error}
    />
  )
}

export default HubMembers
