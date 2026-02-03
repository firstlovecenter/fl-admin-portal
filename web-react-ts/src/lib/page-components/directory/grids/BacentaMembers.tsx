import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '@/components/members-grids/MembersGrid'
import { GET_BACENTA_MEMBERS } from './GridQueries'
import { ChurchContext } from '@/contexts/ChurchContext'

const BacentaMembers = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_BACENTA_MEMBERS, {
    variables: { id: bacentaId },
  })

  return (
    <MembersGrid
      title={data ? `${data.bacentas[0]?.name} Bacenta` : null}
      data={data?.bacentas[0]?.members}
      loading={loading}
      error={error}
    />
  )
}

export default BacentaMembers
