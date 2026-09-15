import { DocumentNode } from 'graphql'
import { CurrentUser } from 'global-types'
import { getISOWeekYear, getWeekNumber } from 'global-utils'
import { isInProgressServiceWeek } from 'pages/services/graphs/graphs-utils'
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

// Plural form used in slide headers ("12 Governorships", "2 Councils").
// Campus → Campuses is the only irregular form.
const CHILD_LEVEL_PLURAL: Record<ShepherdingLevel, string> = {
  Denomination: 'Denominations',
  Oversight: 'Oversights',
  Campus: 'Campuses',
  Stream: 'Streams',
  Council: 'Councils',
  Governorship: 'Governorships',
  Bacenta: 'Bacentas',
}

export const childLevelLabel = (
  parentLevel: ShepherdingLevel,
  count: number
): string | null => {
  const child = nextLevelFor(parentLevel)
  if (!child) return null
  return count === 1
    ? child
    : CHILD_LEVEL_PLURAL[child]
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

// English canonical labels. UI must translate at display via
// t(`shepherding.metrics.${key}`) — do not render these strings directly.
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

// Returns the N records ending at the anchor week, ordered ascending by
// (year, week) for charting. Records past the anchor are dropped; older
// records than the window start are dropped too.
export const sliceWindowedRecords = (
  records: AggregateRecord[],
  anchor: AnchorWeekYear,
  windowWeeks: WindowWeeks,
  now: Date = new Date()
): AggregateRecord[] => {
  if (!records?.length) return []

  const anchorKey = anchor.year * 100 + anchor.week
  const filtered = records.filter((r) => {
    if (r.week == null || r.year == null) return false
    // Every metric charted here (service + bussing aggregates) is Sunday-
    // cadence, so a week whose Sunday has not arrived has nothing due yet and
    // must stay off the chart — the same gate `getServiceGraphData` applies to
    // the rest of the portal (SYN-214). Enforced per record rather than only
    // via the anchor so paging the anchor forward cannot resurrect it.
    if (isInProgressServiceWeek(r.week, r.year, now)) return false
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

// The presentation opens on the most recent week that is actually due. Before
// its Sunday the current week has nothing submitted against it, so anchoring on
// it made the newest column — and the "Week N, YYYY" header and the PDF export
// default that read off the same anchor — a partial week. SYN-217.
export const currentAnchorWeekYear = (
  now: Date = new Date()
): AnchorWeekYear => {
  // `getWeekNumber` mutates the Date it is handed, hence the copy;
  // `getISOWeekYear` copies internally.
  const week = getWeekNumber(new Date(now))
  const year = getISOWeekYear(now)

  if (!isInProgressServiceWeek(week, year, now)) return { week, year }

  // Step back seven days on the same Date rather than going through
  // `shiftAnchor`: that helper rebuilds its date in UTC while `getWeekNumber` /
  // `getISOWeekYear` read local time, so the two disagree by a day — and
  // therefore sometimes by a whole week — for anyone not on UTC.
  const lastWeek = new Date(now)
  lastWeek.setDate(lastWeek.getDate() - 7)

  return {
    week: getWeekNumber(new Date(lastWeek)),
    year: getISOWeekYear(lastWeek),
  }
}
