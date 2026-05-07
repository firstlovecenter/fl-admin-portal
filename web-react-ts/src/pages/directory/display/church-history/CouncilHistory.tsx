import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { HistoryLog } from 'global-types'
import ChurchHistoryView from './ChurchHistoryView'
import { COUNCIL_HISTORY } from './HistoryQueries'

type CouncilHistoryData = {
  councils: Array<{
    id: string
    name: string
    historyCount: number
    history: HistoryLog[]
  }>
}

const CouncilHistory = () => {
  const { councilId } = useContext(ChurchContext)

  return (
    <ChurchHistoryView<CouncilHistoryData>
      parentTypename="Council"
      parentId={councilId}
      query={COUNCIL_HISTORY}
      pluckParent={(d) => {
        const c = d?.councils?.[0]
        if (!c) return undefined
        return {
          displayName: c.name,
          historyCount: c.historyCount,
          history: c.history,
        }
      }}
      headingSuffix="History"
    />
  )
}

export default CouncilHistory
