import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { HistoryLog } from 'global-types'
import ChurchHistoryView from './ChurchHistoryView'
import { BACENTA_HISTORY } from './HistoryQueries'

type BacentaHistoryData = {
  bacentas: Array<{
    id: string
    name: string
    historyCount: number
    history: HistoryLog[]
  }>
}

const BacentaHistory = () => {
  const { bacentaId } = useContext(ChurchContext)

  return (
    <ChurchHistoryView<BacentaHistoryData>
      parentTypename="Bacenta"
      parentId={bacentaId}
      query={BACENTA_HISTORY}
      pluckParent={(d) => {
        const b = d?.bacentas?.[0]
        if (!b) return undefined
        return {
          displayName: b.name,
          historyCount: b.historyCount,
          history: b.history,
        }
      }}
      headingSuffix="History"
    />
  )
}

export default BacentaHistory
