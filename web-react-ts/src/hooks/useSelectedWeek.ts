import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { getIsoWeek } from 'pages/reports/_shared/week-utils'

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

/**
 * Monday (UTC) of the given ISO week. Mirrors the Neo4j semantics used by the
 * `weekStart` parameter on the defaulters @cypher fields.
 */
const isoWeekMonday = (week: number, year: number): Date => {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))
  const target = new Date(week1Monday)
  target.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)
  return target
}

const toYmd = (date: Date): string => date.toISOString().slice(0, 10)

const formatRange = (monday: Date, sunday: Date): string => {
  const sameMonth = monday.getUTCMonth() === sunday.getUTCMonth()
  const sameYear = monday.getUTCFullYear() === sunday.getUTCFullYear()
  const startMonth = MONTH_NAMES_SHORT[monday.getUTCMonth()]
  const endMonth = MONTH_NAMES_SHORT[sunday.getUTCMonth()]
  const year = sunday.getUTCFullYear()
  if (sameMonth) {
    return `${monday.getUTCDate()}–${sunday.getUTCDate()} ${endMonth} ${year}`
  }
  if (sameYear) {
    return `${monday.getUTCDate()} ${startMonth} – ${sunday.getUTCDate()} ${endMonth} ${year}`
  }
  return `${monday.getUTCDate()} ${startMonth} ${monday.getUTCFullYear()} – ${sunday.getUTCDate()} ${endMonth} ${year}`
}

export type SelectedWeek = {
  /** ISO week number (1–53). */
  week: number
  /** ISO week year. */
  year: number
  /** Monday of the selected week as `YYYY-MM-DD`. Send to GraphQL as `weekStart`. */
  weekStart: string
  /** Concise display label, e.g. `"Week 18 · 4–10 May 2026"`. */
  weekLabel: string
  /** Short label without the month range, e.g. `"Week 18, 2026"`. */
  weekShortLabel: string
  /** Just the date range, e.g. `"4–10 May 2026"`. */
  rangeLabel: string
  /** True when the URL-derived week matches the current ISO week. */
  isCurrent: boolean
  prevWeek: () => void
  nextWeek: () => void
  resetToCurrent: () => void
  /** Append `?week=&year=` to internal links so the selection survives navigation. */
  linkWith: (path: string) => string
}

const useSelectedWeek = (): SelectedWeek => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Re-evaluated on every render. A PWA stays open across midnight and across
  // Monday rollovers (pastors check Sunday night → Monday morning) — caching
  // `today` via `useMemo([], [])` would freeze the "current week" gate to
  // first-mount and let the user navigate past the actual current week.
  const today = new Date()
  const current = getIsoWeek(today)

  const weekParam = searchParams.get('week')
  const yearParam = searchParams.get('year')
  const parsedWeek = weekParam ? Number(weekParam) : NaN
  const parsedYear = yearParam ? Number(yearParam) : NaN
  const week =
    Number.isFinite(parsedWeek) && parsedWeek >= 1 && parsedWeek <= 53
      ? parsedWeek
      : current.week
  const year =
    Number.isFinite(parsedYear) && parsedYear >= 2000
      ? parsedYear
      : current.year

  const monday = useMemo(() => isoWeekMonday(week, year), [week, year])
  const sunday = useMemo(() => {
    const d = new Date(monday)
    d.setUTCDate(d.getUTCDate() + 6)
    return d
  }, [monday])

  const weekStart = toYmd(monday)
  const rangeLabel = formatRange(monday, sunday)
  const weekShortLabel = `Week ${week}, ${year}`
  const weekLabel = `Week ${week} · ${rangeLabel}`

  const isCurrent = week === current.week && year === current.year

  const navigateToWeek = useCallback(
    (w: number, y: number) => {
      const next = new URLSearchParams(searchParams)
      if (w === current.week && y === current.year) {
        next.delete('week')
        next.delete('year')
      } else {
        next.set('week', String(w))
        next.set('year', String(y))
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams, current.week, current.year]
  )

  const prevWeek = useCallback(() => {
    const m = new Date(monday)
    m.setUTCDate(m.getUTCDate() - 7)
    const { week: w, year: y } = getIsoWeek(m)
    navigateToWeek(w, y)
  }, [monday, navigateToWeek])

  const nextWeek = useCallback(() => {
    if (isCurrent) return
    const m = new Date(monday)
    m.setUTCDate(m.getUTCDate() + 7)
    const { week: w, year: y } = getIsoWeek(m)
    if (
      y > current.year ||
      (y === current.year && w > current.week)
    ) {
      navigateToWeek(current.week, current.year)
      return
    }
    navigateToWeek(w, y)
  }, [isCurrent, monday, navigateToWeek, current.week, current.year])

  const resetToCurrent = useCallback(() => {
    navigateToWeek(current.week, current.year)
  }, [navigateToWeek, current.week, current.year])

  const linkWith = useCallback(
    (path: string) => {
      if (isCurrent) return path
      const separator = path.includes('?') ? '&' : '?'
      return `${path}${separator}week=${week}&year=${year}`
    },
    [isCurrent, week, year]
  )

  return {
    week,
    year,
    weekStart,
    weekLabel,
    weekShortLabel,
    rangeLabel,
    isCurrent,
    prevWeek,
    nextWeek,
    resetToCurrent,
    linkWith,
  }
}

export default useSelectedWeek
