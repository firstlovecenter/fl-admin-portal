import { type DocumentNode, useQuery } from '@apollo/client'
import { useMemo, useState } from 'react'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { getHumanReadableDate } from 'global-utils'
import { defaultRangeIsoStrings, parseDateInput, toWeekKey } from './week-utils'
import {
  LEVEL_COLLECTION_KEY,
  TARGETS_BY_SCOPE,
  isSubChurchScope,
  type SubChurchesAtLevelScope,
  type SubChurchesTargetLevel,
  type WeeklyChurchReportEntryWithAncestors,
} from './report-types'

type Args = {
  // One DocumentNode per valid scope. The hook picks the right one based
  // on the active church-role scope.
  queriesByScope: Record<SubChurchesAtLevelScope, DocumentNode>
  // Active target level (deepest tick on the picker). Validated against
  // the scope's allowed targets in `TARGETS_BY_SCOPE`. When invalid the
  // hook skips the network request and returns empty entries.
  targetLevel: SubChurchesTargetLevel | null
}

type State = {
  startDate: string
  endDate: string
  setStartDate: (value: string) => void
  setEndDate: (value: string) => void
  loading: boolean
  error: ReturnType<typeof useQuery>['error']
  entries: WeeklyChurchReportEntryWithAncestors[]
  scope: SubChurchesAtLevelScope | undefined
  churchId: string | undefined
  churchName: string
  rangeLabel: string | null
}

export const useSubChurchesAtLevelQuery = ({
  queriesByScope,
  targetLevel,
}: Args): State => {
  const { selectedScope } = useChurchRoleScope()
  const scope = isSubChurchScope(selectedScope?.churchType)
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
  // when scope is missing so the hook never sees `undefined`.
  const query = scope ? queriesByScope[scope] : queriesByScope.Oversight

  // Belt-and-braces: even if a misbehaving caller passes a target the
  // current scope can't reach, skip rather than hit the resolver guard.
  const targetAllowed =
    scope !== undefined &&
    targetLevel !== null &&
    TARGETS_BY_SCOPE[scope].includes(targetLevel)

  const skip =
    !churchId ||
    !scope ||
    !targetAllowed ||
    startWeekKey === null ||
    endWeekKey === null ||
    startWeekKey > endWeekKey

  const { data, loading, error } = useQuery(query, {
    variables: { id: churchId, startWeekKey, endWeekKey, targetLevel },
    skip,
  })

  const entries: WeeklyChurchReportEntryWithAncestors[] = useMemo(() => {
    if (!data || !scope) return []
    const collection = data[LEVEL_COLLECTION_KEY[scope]]
    return collection?.[0]?.subChurchesReportAtLevel ?? []
  }, [data, scope])

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
    loading,
    error,
    entries,
    scope,
    churchId,
    churchName,
    rangeLabel,
  }
}
