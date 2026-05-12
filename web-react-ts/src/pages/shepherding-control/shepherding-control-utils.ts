import { DocumentNode } from 'graphql'
import { CurrentUser } from 'global-types'
import { getISOWeekYear, getWeekNumber } from 'global-utils'
import {
  SHEPHERDING_BACENTA,
  SHEPHERDING_CAMPUS,
  SHEPHERDING_COUNCIL,
  SHEPHERDING_DENOMINATION,
  SHEPHERDING_GOVERNORSHIP,
  SHEPHERDING_OVERSIGHT,
  SHEPHERDING_STREAM,
} from './ShepherdingControlQueries'
import {
  AggregateRecord,
  AnchorWeekYear,
  MetricKey,
  MetricUnit,
  ShepherdingLevel,
  SlideNode,
  WindowWeeks,
} from './shepherding-control-types'

export const SHEPHERDING_LEVELS: ShepherdingLevel[] = [
  'Denomination',
  'Oversight',
  'Campus',
  'Stream',
  'Council',
  'Governorship',
  'Bacenta',
]

export const QUERY_FOR_LEVEL: Record<ShepherdingLevel, DocumentNode> = {
  Denomination: SHEPHERDING_DENOMINATION,
  Oversight: SHEPHERDING_OVERSIGHT,
  Campus: SHEPHERDING_CAMPUS,
  Stream: SHEPHERDING_STREAM,
  Council: SHEPHERDING_COUNCIL,
  Governorship: SHEPHERDING_GOVERNORSHIP,
  Bacenta: SHEPHERDING_BACENTA,
}

export const RESULT_KEY_FOR_LEVEL: Record<ShepherdingLevel, string> = {
  Denomination: 'denominations',
  Oversight: 'oversights',
  Campus: 'campuses',
  Stream: 'streams',
  Council: 'councils',
  Governorship: 'governorships',
  Bacenta: 'bacentas',
}

// Lower-case slug used by drill-down child queries (matches Apollo type names).
export const childRelationshipFor: Record<
  ShepherdingLevel,
  | 'oversights'
  | 'campuses'
  | 'streams'
  | 'councils'
  | 'governorships'
  | 'bacentas'
  | null
> = {
  Denomination: 'oversights',
  Oversight: 'campuses',
  Campus: 'streams',
  Stream: 'councils',
  Council: 'governorships',
  Governorship: 'bacentas',
  Bacenta: null,
}

export const nextLevelFor = (
  level: ShepherdingLevel
): ShepherdingLevel | null => {
  const idx = SHEPHERDING_LEVELS.indexOf(level)
  if (idx < 0 || idx >= SHEPHERDING_LEVELS.length - 1) return null
  return SHEPHERDING_LEVELS[idx + 1]
}

const ROLE_PRIORITY: { role: keyof CurrentUser; level: ShepherdingLevel }[] = [
  { role: 'denomination', level: 'Denomination' },
  { role: 'oversight', level: 'Oversight' },
  { role: 'campus', level: 'Campus' },
  { role: 'stream', level: 'Stream' },
  { role: 'council', level: 'Council' },
  { role: 'governorship', level: 'Governorship' },
  { role: 'bacenta', level: 'Bacenta' },
]

// Resolves the presenter's starting node from the highest-rank leader/admin
// role on `currentUser`. Each level's id is set by `SetPermissions.tsx` from
// the matching `leadsX` / `isAdminForX` arrays.
export const resolveStartingScope = (
  currentUser: CurrentUser,
  hasLeaderRoleAt: (level: ShepherdingLevel) => boolean
): SlideNode | null => {
  for (const { role, level } of ROLE_PRIORITY) {
    const id = currentUser[role]
    if (typeof id === 'string' && id && hasLeaderRoleAt(level)) {
      return { type: level, id, name: '' }
    }
  }
  return null
}

export const METRIC_DATASET: Record<MetricKey, 'service' | 'bussing'> = {
  serviceAttendance: 'service',
  bussingAttendance: 'bussing',
  income: 'service',
}

export const METRIC_DATAKEY: Record<MetricKey, 'attendance' | 'income'> = {
  serviceAttendance: 'attendance',
  bussingAttendance: 'attendance',
  income: 'income',
}

export const METRIC_UNIT: Record<MetricKey, MetricUnit> = {
  serviceAttendance: 'attendance',
  bussingAttendance: 'attendance',
  income: 'cedis',
}

export const METRIC_LABEL: Record<MetricKey, string> = {
  serviceAttendance: 'Service Attendance',
  bussingAttendance: 'Bussing Attendance',
  income: 'Income (GHS)',
}

// Per-metric chart colour. Pulled from the existing feature-accent design
// tokens so the legend implicitly cross-references the rest of the portal
// (purple = services, orange = bussing aggregate, green = banking/money).
export const METRIC_COLOR: Record<MetricKey, string> = {
  serviceAttendance: 'hsl(var(--churches))',
  bussingAttendance: 'hsl(var(--defaulters))',
  income: 'hsl(var(--banking))',
}

// Window sizes are tied to the 4/6/8 toggle in the spec.
export const WINDOW_SIZES: WindowWeeks[] = [4, 6, 8]

export const currentAnchorWeekYear = (): AnchorWeekYear => ({
  week: getWeekNumber(),
  year: getISOWeekYear(),
})

// Returns the N records ending at the anchor week, ordered ascending by
// (year, week) for charting. Records past the anchor are dropped; older
// records than the window start are dropped too.
export const sliceWindowedRecords = (
  records: AggregateRecord[],
  anchor: AnchorWeekYear,
  windowWeeks: WindowWeeks
): AggregateRecord[] => {
  if (!records?.length) return []

  const anchorKey = anchor.year * 100 + anchor.week
  const filtered = records.filter((r) => {
    if (r.week == null || r.year == null) return false
    const key = Number(r.year) * 100 + Number(r.week)
    return key <= anchorKey
  })

  const sorted = [...filtered].sort((a, b) => {
    const aKey = Number(a.year) * 100 + Number(a.week)
    const bKey = Number(b.year) * 100 + Number(b.week)
    return aKey - bKey
  })

  return sorted.slice(-windowWeeks)
}

// Shifts the anchor by `weeks` ISO weeks. Negative = older, positive = newer.
export const shiftAnchor = (
  anchor: AnchorWeekYear,
  weeks: number
): AnchorWeekYear => {
  // Reconstruct a Date from the ISO week, shift by weeks, re-derive
  // (week, year). Uses the same convention as `getWeekNumber` /
  // `getISOWeekYear` (ISO 8601 weeks).
  const jan4 = new Date(Date.UTC(anchor.year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))
  const shifted = new Date(week1Monday)
  shifted.setUTCDate(week1Monday.getUTCDate() + (anchor.week - 1 + weeks) * 7)
  return {
    week: getWeekNumber(shifted),
    year: getISOWeekYear(shifted),
  }
}

export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'scope'

export const pdfFileName = (
  scopeName: string,
  anchor: AnchorWeekYear
): string =>
  `shepherding-control_${slugify(scopeName)}_week-${anchor.week}-${anchor.year}.pdf`
