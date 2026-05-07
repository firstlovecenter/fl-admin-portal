import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { HistoryLog } from 'global-types'
import ChurchHistoryView from './ChurchHistoryView'
import { STREAM_HISTORY } from './HistoryQueries'

type StreamHistoryData = {
  streams: Array<{
    id: string
    name: string
    historyCount: number
    history: HistoryLog[]
  }>
}

const StreamHistory = () => {
  const { streamId } = useContext(ChurchContext)

  return (
    <ChurchHistoryView<StreamHistoryData>
      parentTypename="Stream"
      parentId={streamId}
      query={STREAM_HISTORY}
      pluckParent={(d) => {
        const s = d?.streams?.[0]
        if (!s) return undefined
        return {
          displayName: s.name,
          historyCount: s.historyCount,
          history: s.history,
        }
      }}
      headingSuffix="History"
    />
  )
}

export default StreamHistory
