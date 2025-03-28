import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '../../../components/members-grids/MembersGrid'
import { GET_GOVERNORSHIP_MEMBERS } from './GridQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'

export const GovernorshipMembers = () => {
  const { governorshipId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_GOVERNORSHIP_MEMBERS, {
    variables: { id: governorshipId },
  })

  return (
    <MembersGrid
      title={data ? `${data?.governorships[0]?.name} Governorship` : null}
      data={data?.governorships[0]?.members}
      loading={loading}
      error={error}
    />
  )
}

export default GovernorshipMembers
