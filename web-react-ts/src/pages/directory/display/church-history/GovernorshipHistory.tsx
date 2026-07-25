import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      headingSuffix={t('directory.churchHistory.headingSuffix')}
    />
  )
}

export default GovernorshipHistory
