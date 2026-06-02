/**
 * ISO 8601 week number for a given date — Thursday-of-week rule.
 * Mirrors the `date().week` semantics used by the Neo4j aggregator so the
 * same `weekKey` (year * 100 + week) lines up between FE and DB.
 */
export const getIsoWeek = (date: Date): { week: number; year: number } => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )
  return { week, year: d.getUTCFullYear() }
}

export const toWeekKey = (date: Date): number => {
  const { week, year } = getIsoWeek(date)
  return year * 100 + week
}

export const fromWeekKey = (
  weekKey: number
): { week: number; year: number } => ({
  week: weekKey % 100,
  year: Math.floor(weekKey / 100),
})

export const formatWeekKey = (weekKey: number): string => {
  const { week, year } = fromWeekKey(weekKey)
  return `Wk ${week} · ${year}`
}

/**
 * Pre-fills the date picker. Default range is the last 12 ISO weeks ending on
 * today (inclusive).
 */
export const defaultRangeIsoStrings = (): { start: string; end: string } => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 12 * 7)
  return {
    start: start.toISOString().slice(0, 10),
    end: today.toISOString().slice(0, 10),
  }
}

export const parseDateInput = (value: string): Date | null => {
  if (!value) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}
