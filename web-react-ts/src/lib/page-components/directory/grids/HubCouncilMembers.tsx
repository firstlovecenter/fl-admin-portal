import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '@/components/members-grids/MembersGrid'
import { GET_HUBCOUNCIL_MEMBERS } from './GridQueries'
import { ChurchContext } from '@/contexts/ChurchContext'

const HubCouncilMembers = () => {
  const { hubCouncilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_HUBCOUNCIL_MEMBERS, {
    variables: { id: hubCouncilId },
  })

  const hubCouncil = data?.hubCouncils[0]

  return (
    <MembersGrid
      title={data ? `${hubCouncil?.name} Hub Council` : null}
      data={hubCouncil?.members}
      loading={loading}
      error={error}
    />
  )
}

export default HubCouncilMembers
