import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '@/components/members-grids/MembersGrid'
import { GET_OVERSIGHT_MEMBERS } from './GridQueries'
import { ChurchContext } from '@/contexts/ChurchContext'

const OversightMembers = () => {
  const { oversightId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_OVERSIGHT_MEMBERS, {
    variables: { id: oversightId },
  })

  return (
    <MembersGrid
      title={data ? `${data?.oversights[0]?.name}` : null}
      data={data && data.oversights[0].members}
      loading={loading}
      error={error}
    />
  )
}

export default OversightMembers
