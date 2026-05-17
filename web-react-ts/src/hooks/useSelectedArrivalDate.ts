import { Context, useCallback, useContext, useEffect, useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router-dom'

import { ChurchContext } from 'contexts/ChurchContext'
import { GET_BUSSING_DATES } from 'hooks/useSelectedArrivalDateQueries'

// `ChurchContext` is plain JS (no createContext type arg), so type the
// surface we touch here rather than spreading `any` through the hook.
type ArrivalDateContext = {
  arrivalDate?: string
  setArrivalDate?: (next: string) => void
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const WEEKDAY_NAMES_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
]

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const isValidIsoDate = (value: string | null | undefined): value is string => {
  if (!value || !ISO_DATE_RE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime())
}

const todayYmd = (): string => {
  // Browser-local "today" anchored at UTC noon to avoid timezone drift on
  // both sides of midnight. Ghana is UTC+0 so this is a no-op there, but
  // any leader using the app on a foreign trip stays on the correct date.
  const now = new Date()
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  )
    .toISOString()
    .slice(0, 10)
}

// Most recent Sunday on/before today. Bussing is anchored to Sunday, so
// landing the dashboard on the most recent Sunday is the right default
// when no URL/context value is set.
const lastSundayYmd = (): string => {
  const today = new Date(`${todayYmd()}T00:00:00Z`)
  const dow = today.getUTCDay() // 0 = Sunday … 6 = Saturday
  if (dow !== 0) today.setUTCDate(today.getUTCDate() - dow)
  return today.toISOString().slice(0, 10)
}

const addDaysYmd = (ymd: string, n: number): string => {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Monday of the church week containing the given YMD. Church weeks run
// Monday → Sunday, so Sunday's bussing is the final day of the week, not
// the first. Matches the ISO 8601 / Neo4j `date().week` convention used by
// the weekly aggregators elsewhere in the app.
const weekStartOf = (ymd: string): string => {
  const d = new Date(`${ymd}T00:00:00Z`)
  const dow = d.getUTCDay() // 0 = Sunday … 6 = Saturday
  const offsetFromMonday = (dow + 6) % 7 // Mon=0, Tue=1, … Sun=6
  d.setUTCDate(d.getUTCDate() - offsetFromMonday)
  return d.toISOString().slice(0, 10)
}

const formatDateLabel = (ymd: string): string => {
  const d = new Date(`${ymd}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return ymd
  const weekday = WEEKDAY_NAMES_SHORT[d.getUTCDay()]
  const day = d.getUTCDate()
  const month = MONTH_NAMES_SHORT[d.getUTCMonth()]
  const year = d.getUTCFullYear()
  return `${weekday}, ${day} ${month} ${year}`
}

// "Week of 4–10 May 2026" / "Week of 28 Apr – 4 May 2026" / cross-year variant.
const formatWeekLabel = (weekStart: string): string => {
  const start = new Date(`${weekStart}T12:00:00Z`)
  const end = new Date(`${addDaysYmd(weekStart, 6)}T12:00:00Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `Week of ${weekStart}`
  }
  const sDay = start.getUTCDate()
  const sMonth = MONTH_NAMES_SHORT[start.getUTCMonth()]
  const sYear = start.getUTCFullYear()
  const eDay = end.getUTCDate()
  const eMonth = MONTH_NAMES_SHORT[end.getUTCMonth()]
  const eYear = end.getUTCFullYear()

  if (sYear !== eYear) {
    return `Week of ${sDay} ${sMonth} ${sYear} – ${eDay} ${eMonth} ${eYear}`
  }
  if (sMonth !== eMonth) {
    return `Week of ${sDay} ${sMonth} – ${eDay} ${eMonth} ${sYear}`
  }
  return `Week of ${sDay}–${eDay} ${sMonth} ${sYear}`
}

// Short label for a day chip, e.g. "Sun 4".
const formatDayChip = (ymd: string): string => {
  const d = new Date(`${ymd}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return ymd
  return `${WEEKDAY_NAMES_SHORT[d.getUTCDay()]} ${d.getUTCDate()}`
}

export type ArrivalDayChip = {
  /** YYYY-MM-DD */
  date: string
  /** Short label like `Sun 4`. */
  label: string
}

export type SelectedArrivalDate = {
  /** YYYY-MM-DD. Always a valid date string — pass straight to GraphQL `arrivalDate`. */
  arrivalDate: string
  /** Pre-formatted single-date label, e.g. `Sun, 03 May 2026`. */
  dateLabel: string
  /** Pre-formatted week-range label, e.g. `Week of 4–10 May 2026`. */
  weekLabel: string
  /** True when the selected date sits within the current calendar week. */
  isCurrent: boolean
  /** Bussing dates within the visible week, ASC. Empty for weeks with no bussings. */
  daysInWeek: ArrivalDayChip[]
  /** Step back one Mon→Sun church week. No-op when no earlier bussing exists. */
  prevWeek: () => void
  /** Step forward one Mon→Sun church week. No-op past the current week. */
  nextWeek: () => void
  /** True iff at least one bussing exists in an earlier week. False during cold load. */
  hasPrev: boolean
  /** True iff the visible week is earlier than the current week. */
  hasNext: boolean
  /** Select a specific bussing date (used by day chips). */
  selectDate: (ymd: string) => void
  /** Jump to the nearest bussing date — past first, future as fallback. */
  jumpToNearest: () => void
  /** True iff `jumpToNearest` would actually navigate. False during cold load or empty data. */
  hasNearest: boolean
  /** Reset to the canonical default (most recent Sunday). */
  resetToCurrent: () => void
  /** Append `?date=YYYY-MM-DD` to a path so the selection survives navigation. */
  linkWith: (path: string) => string
}

const useSelectedArrivalDate = (): SelectedArrivalDate => {
  const [searchParams, setSearchParams] = useSearchParams()
  const churchCtx = useContext(
    ChurchContext as Context<ArrivalDateContext | undefined>
  )
  const ctxArrivalDate = churchCtx?.arrivalDate
  const setCtxArrivalDate = churchCtx?.setArrivalDate

  // `cache-and-network` so a long PWA session sees today's Sunday appear in
  // the list as soon as the first BussingRecord is written, without forcing
  // a hard reload. Apollo still dedupes concurrent consumers, so the cost is
  // one shared round trip per page transition.
  const { data: datesData, loading: datesLoading } = useQuery<{
    bussingDates: string[]
  }>(GET_BUSSING_DATES, { fetchPolicy: 'cache-and-network' })
  const bussingDates = useMemo(
    () => datesData?.bussingDates ?? [],
    [datesData]
  )

  const dateParam = searchParams.get('date')
  const fallback = isValidIsoDate(ctxArrivalDate)
    ? ctxArrivalDate
    : lastSundayYmd()

  const arrivalDate = isValidIsoDate(dateParam) ? dateParam : fallback
  // "Current week" tracks the church week containing the most recent
  // Sunday bussing. Pinning to today's Monday would mark Sunday's data as
  // "last week" the moment midnight ticks over — pastors review Sunday
  // night → Monday morning, so the most recent bussing must stay current.
  const currentWeekStart = weekStartOf(lastSundayYmd())
  const weekStart = weekStartOf(arrivalDate)
  const weekEnd = addDaysYmd(weekStart, 6)
  const isCurrent = weekStart === currentWeekStart
  const dateLabel = formatDateLabel(arrivalDate)
  const weekLabel = formatWeekLabel(weekStart)

  // Bussings within the visible week, ASC.
  const daysInWeek = useMemo<ArrivalDayChip[]>(() => {
    const inWeek = bussingDates.filter((d) => d >= weekStart && d <= weekEnd)
    // bussingDates is returned DESC, so reverse to get ASC ordering for the
    // chip row. `sort()` on YYYY-MM-DD strings sorts lexicographically =
    // chronologically.
    return inWeek
      .slice()
      .sort()
      .map((date) => ({ date, label: formatDayChip(date) }))
  }, [bussingDates, weekStart, weekEnd])

  // bussingDates is DESC: the first entry strictly less than weekStart is
  // the most recent bussing before the visible week. Used to gate `hasPrev`
  // and as the past candidate for `jumpToNearest`.
  const pastNearest = useMemo(
    () => bussingDates.find((d) => d < weekStart),
    [bussingDates, weekStart]
  )

  // Smallest entry strictly greater than weekEnd — the nearest future bussing.
  // Used as the fallback target for `jumpToNearest` when no past exists.
  const futureNearest = useMemo<string | undefined>(() => {
    let candidate: string | undefined
    for (const d of bussingDates) {
      if (d > weekEnd) candidate = d
      else break
    }
    return candidate
  }, [bussingDates, weekEnd])

  // Stay disabled during a *cold* load — falling back to ±7 days re-introduces
  // the exact "land on a date with no data" bug this feature removes. Once
  // we've seen any data, refetches (cache-and-network) keep using it.
  const coldLoading = datesLoading && bussingDates.length === 0
  const hasPrev = coldLoading ? false : pastNearest !== undefined
  // `hasNext` is intentionally NOT cold-load gated. Forward stepping is
  // pure calendar arithmetic capped at the current week — there is no
  // "land on a date with no data" risk because empty future weeks now
  // render the empty-week state instead of breaking the dashboard.
  const hasNext = weekStart < currentWeekStart
  const hasNearest = coldLoading
    ? false
    : pastNearest !== undefined || futureNearest !== undefined

  // Keep ChurchContext in lockstep with the URL so the legacy Bootstrap
  // dashboards (which still read `arrivalDate` straight from context)
  // refresh when the user steps weeks via the new selector. Skip the call
  // when the values already match to avoid a render loop.
  useEffect(() => {
    if (
      typeof setCtxArrivalDate === 'function' &&
      ctxArrivalDate !== arrivalDate
    ) {
      setCtxArrivalDate(arrivalDate)
    }
  }, [arrivalDate, ctxArrivalDate, setCtxArrivalDate])

  const navigateToDate = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams)
      const sundayDefault = lastSundayYmd()
      if (next === sundayDefault) {
        params.delete('date')
      } else {
        params.set('date', next)
      }
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  // When the visible week has exactly one bussing date and the current
  // selection isn't that date (e.g. user URL-jumped to the Sunday of a week
  // whose only bussing is on Wednesday), snap to the bussing date. This is
  // what makes the "hide chip row when one date" rule actually useful — the
  // dashboard renders data instead of an empty Sunday.
  useEffect(() => {
    if (daysInWeek.length !== 1) return
    const onlyDate = daysInWeek[0].date
    if (arrivalDate === onlyDate) return
    navigateToDate(onlyDate)
  }, [daysInWeek, arrivalDate, navigateToDate])

  // Step prev/next by Mon→Sun church week. When the destination week
  // contains bussings, land on the earliest bussing of that week so the
  // dashboard renders data immediately; otherwise land on the Monday so the
  // empty-week state can render.
  const navigateToWeek = useCallback(
    (targetWeekStart: string) => {
      const targetWeekEnd = addDaysYmd(targetWeekStart, 6)
      const datesInTargetWeek = bussingDates
        .filter((d) => d >= targetWeekStart && d <= targetWeekEnd)
        .sort()
      const target = datesInTargetWeek[0] ?? targetWeekStart
      navigateToDate(target)
    },
    [bussingDates, navigateToDate]
  )

  const prevWeek = useCallback(() => {
    if (!hasPrev) return
    navigateToWeek(addDaysYmd(weekStart, -7))
  }, [hasPrev, weekStart, navigateToWeek])

  const nextWeek = useCallback(() => {
    if (!hasNext) return
    navigateToWeek(addDaysYmd(weekStart, 7))
  }, [hasNext, weekStart, navigateToWeek])

  const selectDate = useCallback(
    (ymd: string) => navigateToDate(ymd),
    [navigateToDate]
  )

  const jumpToNearest = useCallback(() => {
    const target = pastNearest ?? futureNearest
    if (!target) return
    navigateToDate(target)
  }, [pastNearest, futureNearest, navigateToDate])

  const resetToCurrent = useCallback(() => {
    navigateToDate(lastSundayYmd())
  }, [navigateToDate])

  const linkWith = useCallback(
    (path: string): string => {
      // Round-trip the exact selected day, not the week. `isCurrent` is
      // week-based and would drop a non-Sunday chip selection in the
      // current week — `linkWith` exists so drill-downs preserve the
      // user's choice down to the day.
      if (arrivalDate === lastSundayYmd()) return path
      const sep = path.includes('?') ? '&' : '?'
      return `${path}${sep}date=${arrivalDate}`
    },
    [arrivalDate]
  )

  return {
    arrivalDate,
    dateLabel,
    weekLabel,
    isCurrent,
    daysInWeek,
    prevWeek,
    nextWeek,
    hasPrev,
    hasNext,
    selectDate,
    jumpToNearest,
    hasNearest,
    resetToCurrent,
    linkWith,
  }
}

export default useSelectedArrivalDate
