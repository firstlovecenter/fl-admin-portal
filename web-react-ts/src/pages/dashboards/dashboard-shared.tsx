import { useEffect, useMemo, useState } from 'react'
import { getHourlyGreeting } from './greetings'

export { formatChurchLevel, getRoleRelationLabel } from 'lib/scope-display'

const HOUR_MS = 60 * 60 * 1000

// Framer-motion variants shared by all dashboard surfaces (UserDashboard,
// ArrivalsCounterDashboard, future role-scoped dashboards). Keep the spring
// + stagger numbers identical so cross-dashboard transitions feel cohesive.
export const sectionStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
}

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
  },
}

export const highlightName = (
  text: string,
  name: string
): React.ReactNode => {
  if (!name) return text
  const idx = text.indexOf(name)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-brand">{name}</span>
      {text.slice(idx + name.length)}
    </>
  )
}

// Drop stale bussing/service records before averaging. The Bacenta SDL has
// no recency filter on `bussing`, so dormant Bacentas would otherwise leak
// years-old data into the dashboard's rolling-average metrics.
// Tolerates `year` as number or string — `getServiceGraphData` types it as
// `number | string` because the SDL value is forwarded verbatim.
export const filterRecentRecords = <
  T extends { year?: number | string | null; date?: string | null }
>(
  records: T[],
  yearsBack = 1
): T[] => {
  const currentYear = new Date().getFullYear()
  const cutoff = currentYear - yearsBack
  return records.filter((record) => {
    if (record?.year !== undefined && record.year !== null) {
      const numericYear = Number(record.year)
      if (Number.isFinite(numericYear)) return numericYear >= cutoff
    }
    if (record?.date) {
      const recordYear = new Date(record.date).getFullYear()
      if (Number.isFinite(recordYear)) return recordYear >= cutoff
    }
    return false
  })
}

// Re-render at the top of every hour so the greeting rotates without a
// reload. Used by every dashboard that surfaces the hourly greeting; the
// `+ 1000` ms cushion guarantees we land *after* the hour boundary, not on
// it (otherwise rounding would re-fire the same hour).
export const useHourlyGreeting = (
  firstName: string,
  userKey: string
): string => {
  const [hourTick, setHourTick] = useState(() =>
    Math.floor(Date.now() / HOUR_MS)
  )
  useEffect(() => {
    const msToNextHour = HOUR_MS - (Date.now() % HOUR_MS) + 1000
    const timer = window.setTimeout(() => {
      setHourTick(Math.floor(Date.now() / HOUR_MS))
    }, msToNextHour)
    return () => window.clearTimeout(timer)
  }, [hourTick])

  return useMemo(
    () =>
      getHourlyGreeting({
        firstName,
        userKey,
        now: new Date(hourTick * HOUR_MS),
      }),
    [firstName, userKey, hourTick]
  )
}
