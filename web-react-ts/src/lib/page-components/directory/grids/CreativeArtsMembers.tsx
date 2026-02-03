import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '@/components/members-grids/MembersGrid'
import { GET_CREATIVEARTS_MEMBERS } from './GridQueries'
import { ChurchContext } from '@/contexts/ChurchContext'

const CreativeArtsMembers = () => {
  const { creativeArtsId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_CREATIVEARTS_MEMBERS, {
    variables: { id: creativeArtsId },
  })

  return (
    <MembersGrid
      title={data ? `${data.creativeArts[0]?.name} Creative Arts` : null}
      data={data?.creativeArts[0]?.members}
      loading={loading}
      error={error}
    />
  )
}

export default CreativeArtsMembers
