import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { HistoryLog } from 'global-types'
import ChurchHistoryView from './ChurchHistoryView'
import { GOVERNORSHIP_HISTORY } from './HistoryQueries'

type GovernorshipHistoryData = {
  governorships: Array<{
    id: string
    name: string
    historyCount: number
    history: HistoryLog[]
  }>
}

const GovernorshipHistory = () => {
  const { governorshipId } = useContext(ChurchContext)

  return (
    <ChurchHistoryView<GovernorshipHistoryData>
      parentTypename="Governorship"
      parentId={governorshipId}
      query={GOVERNORSHIP_HISTORY}
      pluckParent={(d) => {
        const g = d?.governorships?.[0]
        if (!g) return undefined
        return {
          displayName: g.name,
          historyCount: g.historyCount,
          history: g.history,
        }
      }}
      headingSuffix="History"
    />
  )
}

export default GovernorshipHistory
