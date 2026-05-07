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

export type DirectoryReportEntry = {
  id: string
  level: ReportLevel
  name: string
  parentName: string | null
  leaderName: string | null
  leaderPhone: string | null
  leaderWhatsApp: string | null
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
  numberOfServices: number | null
  bussingAttendance: number | null
  bussingLeaderDeclaration: number | null
  numberOfSprinters: number | null
  numberOfUrvans: number | null
  numberOfCars: number | null
  bussingTopUp: number | null
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
