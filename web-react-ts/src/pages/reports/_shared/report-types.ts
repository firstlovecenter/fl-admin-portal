export type ReportLevel =
  | 'Bacenta'
  | 'Governorship'
  | 'Council'
  | 'Stream'
  | 'Campus'
  | 'Oversight'

/**
 * GraphQL collection name for each level. `Campus` and `Bacenta` have
 * irregular plurals — naive `${level.toLowerCase()}s` produces wrong keys
 * (`campuss`, etc.). Use this map everywhere instead of deriving.
 */
export const LEVEL_COLLECTION_KEY: Record<ReportLevel, string> = {
  Bacenta: 'bacentas',
  Governorship: 'governorships',
  Council: 'councils',
  Stream: 'streams',
  Campus: 'campuses',
  Oversight: 'oversights',
}

const REPORT_LEVELS: ReadonlySet<string> = new Set<ReportLevel>([
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
])

export const isReportLevel = (value: string | undefined): value is ReportLevel =>
  value !== undefined && REPORT_LEVELS.has(value)

export type DirectoryAncestorEntry = {
  id: string
  level: ReportLevel
  name: string
  leaderFirstName: string | null
  leaderLastName: string | null
  leaderPhone: string | null
  leaderWhatsApp: string | null
}

export type DirectoryReportEntry = {
  id: string
  level: ReportLevel
  name: string
  leaderFirstName: string | null
  leaderLastName: string | null
  leaderPhone: string | null
  leaderWhatsApp: string | null
  ancestors: DirectoryAncestorEntry[]
  latitude: number | null
  longitude: number | null
}

export type WeeklyChurchReportEntry = {
  id: string
  churchId: string
  churchName: string
  churchLevel: ReportLevel
  week: number
  year: number
  serviceAttendance: number | null
  serviceIncome: number | null
  serviceDollarIncome: number | null
  serviceCurrency: string | null
  numberOfServices: number | null
  bussingAttendance: number | null
  bussingLeaderDeclaration: number | null
  numberOfSprinters: number | null
  numberOfUrvans: number | null
  numberOfCars: number | null
  bussingTopUp: number | null
}

// Scope levels whose `subChurchesReportAtLevel` resolver is wired on the
// backend. Governorship is excluded because Bacenta is its only descendant
// and Bacenta-as-target is not supported (raw-record aggregation is too
// heavy for that path).
export type SubChurchesAtLevelScope = 'Council' | 'Stream' | 'Campus' | 'Oversight'

// Aggregate-backed levels valid as a row-granularity target.
export type SubChurchesTargetLevel =
  | 'Governorship'
  | 'Council'
  | 'Stream'
  | 'Campus'

// Top-down canonical order. Used to derive default ticks, pick the deepest
// ticked level as the row-granularity target, and order ancestor columns.
export const SUB_CHURCH_TARGETS_ORDERED: readonly SubChurchesTargetLevel[] = [
  'Campus',
  'Stream',
  'Council',
  'Governorship',
]

// Valid targets per scope. Mirrors backend `IN_BETWEEN` keys in
// `api/src/resolvers/reports/weekly-report-cypher.ts`.
export const TARGETS_BY_SCOPE: Record<
  SubChurchesAtLevelScope,
  readonly SubChurchesTargetLevel[]
> = {
  Oversight: ['Campus', 'Stream', 'Council', 'Governorship'],
  Campus: ['Stream', 'Council', 'Governorship'],
  Stream: ['Council', 'Governorship'],
  Council: ['Governorship'],
}

const SUB_CHURCH_SCOPES: ReadonlySet<string> = new Set<SubChurchesAtLevelScope>([
  'Council',
  'Stream',
  'Campus',
  'Oversight',
])

export const isSubChurchScope = (
  value: string | undefined
): value is SubChurchesAtLevelScope =>
  value !== undefined && SUB_CHURCH_SCOPES.has(value)

export type WeeklyChurchReportAncestor = {
  level: SubChurchesTargetLevel
  name: string | null
  leaderFirstName: string | null
  leaderLastName: string | null
  leaderPhone: string | null
}

export type WeeklyChurchReportEntryWithAncestors = WeeklyChurchReportEntry & {
  targetLeaderFirstName: string | null
  targetLeaderLastName: string | null
  targetLeaderPhone: string | null
  ancestors: WeeklyChurchReportAncestor[]
}

export type ServiceTreasurerEntry = {
  id: string
  name: string
  phone: string | null
  whatsapp: string | null
}

export type ServiceRecordDetailEntry = {
  id: string
  churchId: string
  churchName: string
  serviceDate: string | null
  week: number | null
  year: number | null
  attendance: number | null
  income: number | null
  cash: number | null
  onlineGiving: number | null
  numberOfTithers: number | null
  dollarIncome: number | null
  foreignCurrency: string | null
  noServiceReason: string | null
  createdAt: string | null
  recordedByName: string | null
  recordedByPhone: string | null
  treasurers: ServiceTreasurerEntry[]
  familyPicture: string | null
  treasurerSelfie: string | null
  bankingSlip: string | null
  transactionStatus: string | null
  bankingProof: boolean | null
  bankedByName: string | null
  bankedByPhone: string | null
}
