import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '@/components/members-grids/MembersGrid'
import { GET_CAMPUS_MEMBERS } from './GridQueries'
import { ChurchContext } from '@/contexts/ChurchContext'

const CampusMembers = () => {
  const { campusId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_CAMPUS_MEMBERS, {
    variables: { id: campusId },
  })

  return (
    <MembersGrid
      title={data ? `${data?.campuses[0]?.name} Campus` : null}
      data={data && data.campuses[0].members}
      loading={loading}
      error={error}
    />
  )
}

export default CampusMembers
