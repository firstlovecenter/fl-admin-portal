/**
 * Thursday-anchored ISO week number, matching the convention used across the
 * existing weekly Lambdas (`accra-campus-weekly`, etc.) and the
 * `weekly-tip-generator` Lambda. Resolver and Lambda must agree on this
 * algorithm or the resolver will look up the wrong key on year boundaries.
 *
 * The Lambda keeps its own copy of this algorithm because Lambda packages
 * are self-contained (own `package.json` per folder). Keep the two in sync.
 */
export const getIsoWeek = (date: Date = new Date()): number => {
  const target = new Date(date.getTime())
  target.setHours(0, 0, 0, 0)
  const dayNum = target.getDay() || 7
  target.setDate(target.getDate() + 4 - dayNum)
  const yearStart = new Date(target.getFullYear(), 0, 1)
  return Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )
}
