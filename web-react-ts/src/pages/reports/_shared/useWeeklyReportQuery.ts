import { type DocumentNode, useQuery } from '@apollo/client'
import { useMemo, useState } from 'react'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { getHumanReadableDate } from 'global-utils'
import { defaultRangeIsoStrings, parseDateInput, toWeekKey } from './week-utils'
import {
  LEVEL_COLLECTION_KEY,
  isReportLevel,
  type ReportLevel,
  type WeeklyChurchReportEntry,
} from './report-types'

type UseWeeklyReportQueryArgs = {
  /** One query per church-level. Indexed by selectedScope.churchType. */
  queriesByLevel: Record<ReportLevel, DocumentNode>
  /** Field on the church node that holds the report rows. */
  reportField: 'weekdayIncomeBussingReport' | 'subChurchesReport'
}

type WeeklyReportQueryState = {
  startDate: string
  endDate: string
  setStartDate: (value: string) => void
  setEndDate: (value: string) => void
  startWeekKey: number | null
  endWeekKey: number | null
  loading: boolean
  error: ReturnType<typeof useQuery>['error']
  entries: WeeklyChurchReportEntry[]
  churchType: ReportLevel | undefined
  churchId: string | undefined
  churchName: string
  rangeLabel: string | null
}

export const useWeeklyReportQuery = ({
  queriesByLevel,
  reportField,
}: UseWeeklyReportQueryArgs): WeeklyReportQueryState => {
  const { selectedScope } = useChurchRoleScope()
  const churchType = isReportLevel(selectedScope?.churchType)
    ? selectedScope?.churchType
    : undefined
  const churchId = selectedScope?.churchId
  const churchName = selectedScope?.churchName ?? ''

  const defaults = useMemo(() => defaultRangeIsoStrings(), [])
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)

  const startDateObj = parseDateInput(startDate)
  const endDateObj = parseDateInput(endDate)
  const startWeekKey = startDateObj ? toWeekKey(startDateObj) : null
  const endWeekKey = endDateObj ? toWeekKey(endDateObj) : null

  // Apollo's useQuery validates the document inside its useState lazy
  // initializer — before `skip` is checked. Pass a stable fallback document
  // when churchType is missing so the hook never sees `undefined`.
  const query = churchType ? queriesByLevel[churchType] : queriesByLevel.Bacenta

  const skip =
    !churchId ||
    !churchType ||
    startWeekKey === null ||
    endWeekKey === null ||
    startWeekKey > endWeekKey

  const { data, loading, error } = useQuery(query, {
    variables: { id: churchId, startWeekKey, endWeekKey },
    skip,
  })

  const entries: WeeklyChurchReportEntry[] = useMemo(() => {
    if (!data || !churchType) return []
    const collection = data[LEVEL_COLLECTION_KEY[churchType]]
    return collection?.[0]?.[reportField] ?? []
  }, [data, churchType, reportField])

  const rangeLabel =
    startWeekKey !== null && endWeekKey !== null
      ? `${getHumanReadableDate(startDate) ?? startDate} → ${
          getHumanReadableDate(endDate) ?? endDate
        }`
      : null

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    startWeekKey,
    endWeekKey,
    loading,
    error,
    entries,
    churchType,
    churchId,
    churchName,
    rangeLabel,
  }
}
