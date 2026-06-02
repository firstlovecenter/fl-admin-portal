import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { HistoryLog } from 'global-types'
import ChurchHistoryView from './ChurchHistoryView'
import { CAMPUS_HISTORY } from './HistoryQueries'

type CampusHistoryData = {
  campuses: Array<{
    id: string
    name: string
    historyCount: number
    history: HistoryLog[]
  }>
}

const CampusHistory = () => {
  const { campusId } = useContext(ChurchContext)

  return (
    <ChurchHistoryView<CampusHistoryData>
      parentTypename="Campus"
      parentId={campusId}
      query={CAMPUS_HISTORY}
      pluckParent={(d) => {
        const c = d?.campuses?.[0]
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

export default CampusHistory
