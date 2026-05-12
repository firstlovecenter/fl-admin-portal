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

const formatDateLabel = (ymd: string): string => {
  const d = new Date(`${ymd}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return ymd
  const weekday = WEEKDAY_NAMES_SHORT[d.getUTCDay()]
  const day = d.getUTCDate()
  const month = MONTH_NAMES_SHORT[d.getUTCMonth()]
  const year = d.getUTCFullYear()
  return `${weekday}, ${day} ${month} ${year}`
}

export type SelectedArrivalDate = {
  /** YYYY-MM-DD. Always a valid date string — pass straight to GraphQL `arrivalDate`. */
  arrivalDate: string
  /** Pre-formatted, e.g. `Sun, 03 May 2026`. */
  dateLabel: string
  /** True when the selected date equals "most recent Sunday" today. */
  isCurrent: boolean
  /** Jump to the nearest earlier date that has at least one BussingRecord. No-op if none. */
  prevWeek: () => void
  /** Jump to the nearest later date that has at least one BussingRecord. No-op if none. */
  nextWeek: () => void
  /** True iff an earlier bussing date exists. False during the initial cold fetch. */
  hasPrev: boolean
  /** True iff a later bussing date exists. False during the initial cold fetch. */
  hasNext: boolean
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
  const isCurrent = arrivalDate === lastSundayYmd()
  const dateLabel = formatDateLabel(arrivalDate)

  // bussingDates is returned DESC, so the largest "earlier than current" is
  // the first entry strictly less than arrivalDate, and the smallest "later
  // than current" is the last entry strictly greater.
  const prevDate = useMemo(
    () => bussingDates.find((d) => d < arrivalDate),
    [bussingDates, arrivalDate]
  )
  const nextDate = useMemo(() => {
    let candidate: string | undefined
    for (const d of bussingDates) {
      if (d > arrivalDate) candidate = d
      else break
    }
    return candidate
  }, [bussingDates, arrivalDate])

  // Stay disabled during a *cold* load — falling back to ±7 days re-introduces
  // the exact "land on a date with no data" bug this feature removes. Once
  // we've seen any data, refetches (cache-and-network) keep using it.
  const coldLoading = datesLoading && bussingDates.length === 0
  const hasPrev = coldLoading ? false : prevDate !== undefined
  const hasNext = coldLoading ? false : nextDate !== undefined

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

  const prevWeek = useCallback(() => {
    if (prevDate) navigateToDate(prevDate)
  }, [prevDate, navigateToDate])

  const nextWeek = useCallback(() => {
    if (nextDate) navigateToDate(nextDate)
  }, [nextDate, navigateToDate])

  const resetToCurrent = useCallback(() => {
    navigateToDate(lastSundayYmd())
  }, [navigateToDate])

  const linkWith = useCallback(
    (path: string): string => {
      if (isCurrent) return path
      const sep = path.includes('?') ? '&' : '?'
      return `${path}${sep}date=${arrivalDate}`
    },
    [isCurrent, arrivalDate]
  )

  return {
    arrivalDate,
    dateLabel,
    isCurrent,
    prevWeek,
    nextWeek,
    hasPrev,
    hasNext,
    resetToCurrent,
    linkWith,
  }
}

export default useSelectedArrivalDate
