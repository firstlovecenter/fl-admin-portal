import { Context, useCallback, useContext, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ChurchContext } from 'contexts/ChurchContext'

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

const shiftDays = (ymd: string, days: number): string => {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export type SelectedArrivalDate = {
  /** YYYY-MM-DD. Always a valid date string — pass straight to GraphQL `arrivalDate`. */
  arrivalDate: string
  /** Pre-formatted, e.g. `Sun, 03 May 2026`. */
  dateLabel: string
  /** True when the selected date equals "most recent Sunday" today. */
  isCurrent: boolean
  /** Step back 7 days. Future: jump to previous *bussing* day if known. */
  prevWeek: () => void
  /** Step forward 7 days, clamped to today (no future bussing). */
  nextWeek: () => void
  /** Step back 1 day. */
  prevDay: () => void
  /** Step forward 1 day, clamped to today. */
  nextDay: () => void
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

  const dateParam = searchParams.get('date')
  const today = todayYmd()
  const fallback = isValidIsoDate(ctxArrivalDate)
    ? ctxArrivalDate
    : lastSundayYmd()

  const arrivalDate = isValidIsoDate(dateParam) ? dateParam : fallback
  const isCurrent = arrivalDate === lastSundayYmd()
  const dateLabel = formatDateLabel(arrivalDate)

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

  const stepDays = useCallback(
    (delta: number) => {
      const target = shiftDays(arrivalDate, delta)
      // Clamp to today — there's no bussing data for future dates and the
      // user can't preview tomorrow's Sunday.
      const clamped = target > today ? today : target
      navigateToDate(clamped)
    },
    [arrivalDate, navigateToDate, today]
  )

  const prevDay = useCallback(() => stepDays(-1), [stepDays])
  const nextDay = useCallback(() => stepDays(1), [stepDays])
  const prevWeek = useCallback(() => stepDays(-7), [stepDays])
  const nextWeek = useCallback(() => stepDays(7), [stepDays])

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
    prevDay,
    nextDay,
    resetToCurrent,
    linkWith,
  }
}

export default useSelectedArrivalDate
