import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '@/components/members-grids/MembersGrid'
import { GET_MINISTRY_MEMBERS } from './GridQueries'
import { ChurchContext } from '@/contexts/ChurchContext'

const MinistryMembers = () => {
  const { ministryId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_MINISTRY_MEMBERS, {
    variables: { id: ministryId },
  })

  return (
    <MembersGrid
      title={data ? `${data.ministries[0]?.name} Ministry` : null}
      data={data?.ministries[0]?.members}
      loading={loading}
      error={error}
    />
  )
}

export default MinistryMembers
