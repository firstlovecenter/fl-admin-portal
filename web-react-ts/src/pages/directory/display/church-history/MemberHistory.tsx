import React, { useContext } from 'react'
import { MemberContext } from 'contexts/MemberContext'
import { HistoryLog } from 'global-types'
import ChurchHistoryView from './ChurchHistoryView'
import { MEMBER_HISTORY } from './HistoryQueries'

type MemberHistoryData = {
  members: Array<{
    id: string
    firstName: string
    lastName: string
    historyCount: number
    history: HistoryLog[]
  }>
}

const MemberHistory = () => {
  const { memberId } = useContext(MemberContext)

  return (
    <ChurchHistoryView<MemberHistoryData>
      parentTypename="Member"
      parentId={memberId}
      query={MEMBER_HISTORY}
      pluckParent={(d) => {
        const m = d?.members?.[0]
        if (!m) return undefined
        return {
          displayName: `${m.firstName} ${m.lastName}`,
          historyCount: m.historyCount,
          history: m.history,
        }
      }}
      headingSuffix="History"
    />
  )
}

export default MemberHistory
