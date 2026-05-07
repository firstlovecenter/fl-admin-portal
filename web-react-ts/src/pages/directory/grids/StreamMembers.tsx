import React, { useContext } from 'react'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_STREAM_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

const StreamMembers = () => {
  const { streamId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_STREAM_MEMBERS}
      parentId={streamId}
      parentTypename="Stream"
      pluckParent={(data) => data?.streams?.[0]}
      getHeading={(parent) => (parent ? `${parent.name} Stream` : null)}
      downloadConfig={
        streamId
          ? {
              level: 'Stream',
              churchId: streamId,
            }
          : null
      }
    />
  )
}

export default StreamMembers
