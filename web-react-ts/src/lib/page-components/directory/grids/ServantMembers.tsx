import { useQuery } from '@apollo/client'
import MembersGrid from 'components/members-grids/MembersGrid'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { GET_SERVANT_MEMBERS } from './GridQueries'

const ServantMembers = () => {
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error } = useQuery(GET_SERVANT_MEMBERS, {
    variables: { id: currentUser.id },
  })

  return (
    <MembersGrid
      title={data ? `${data?.members[0]?.fullName} Membership` : null}
      data={data?.members[0]?.members}
      loading={loading}
      error={error}
    />
  )
}

export default ServantMembers
