import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MembersGrid from '@/components/members-grids/MembersGrid'
import { GET_STREAM_MEMBERS } from './GridQueries'
import { ChurchContext } from '@/contexts/ChurchContext'
// import TabletDesktopView from 'components/responsive-design/TabletDesktopView'

const StreamMembers = () => {
  const { streamId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_STREAM_MEMBERS, {
    variables: { id: streamId },
  })

  return (
    <MembersGrid
      title={data ? `${data?.streams[0]?.name} Stream` : null}
      data={data && data.streams[0].members}
      loading={loading}
      error={error}
    />
  )
}

export default StreamMembers
