import JSZip from 'jszip'
import * as XLSX from 'xlsx'

export type ArrivalsDownloadLevel =
  | 'Governorship'
  | 'Council'
  | 'Stream'
  | 'Campus'

const DOWNLOADABLE_LEVELS: ReadonlyArray<ArrivalsDownloadLevel> = [
  'Governorship',
  'Council',
  'Stream',
  'Campus',
]

export const isArrivalsDownloadLevel = (
  level: string | null | undefined
): level is ArrivalsDownloadLevel =>
  !!level && (DOWNLOADABLE_LEVELS as readonly string[]).includes(level)

export type ArrivalsDetailRow = {
  stream?: string | null
  council?: string | null
  governorship?: string | null
  bacenta?: string | null
  leader?: string | null
  leaderPhone?: string | null
  leaderWhatsapp?: string | null
  meetingDay?: string | null
  vacationStatus?: string | null
  bussingRecorded?: string | null
  attendance?: number | null
  leaderDeclaration?: number | null
  sprinters?: number | null
  urvans?: number | null
  cars?: number | null
  bussingCost?: number | null
  bussingTopUp?: number | null
  [key: string]: unknown
}

export type ArrivalsVehicleRow = {
  stream?: string | null
  council?: string | null
  governorship?: string | null
  bacenta?: string | null
  vehicleType?: string | null
  attendance?: number | null
  leaderDeclaration?: number | null
  vehicleCost?: number | null
  vehicleTopUp?: number | null
  momoNumberMasked?: string | null
  mobileNetwork?: string | null
  transactionStatus?: string | null
  direction?: string | null
  arrivalTime?: string | null
  comments?: string | null
  [key: string]: unknown
}

export type ArrivalsSummaryRow = {
  child?: string | null
  childLeader?: string | null
  activeBacentas?: number | null
  bacentasWithBussing?: number | null
  totalAttendance?: number | null
  totalLeaderDeclaration?: number | null
  totalSprinters?: number | null
  totalUrvans?: number | null
  totalCars?: number | null
  totalBussingTopUp?: number | null
  totalBussingCost?: number | null
  [key: string]: unknown
}

// Picker-shaped row returned alongside `summary` when the caller passes
// `?targetLevel=`. Rows live at the chosen target level (Stream / Council
// / Governorship). Each carries the in-between ancestor chain so the FE
// can flatten it into columns.
export type ArrivalsAncestorRow = {
  level: 'Stream' | 'Council' | 'Governorship'
  name?: string | null
  leaderFirstName?: string | null
  leaderLastName?: string | null
  leaderPhone?: string | null
}

export type ArrivalsSummaryAtLevelRow = {
  targetId: string
  targetName: string
  targetLevel: 'Stream' | 'Council' | 'Governorship'
  targetLeaderFirstName?: string | null
  targetLeaderLastName?: string | null
  targetLeaderPhone?: string | null
  activeBacentas: number
  bacentasWithBussing: number
  totalAttendance: number
  totalLeaderDeclaration: number
  totalSprinters: number
  totalUrvans: number
  totalCars: number
  totalBussingTopUp: number
  totalBussingCost: number
  ancestors: ArrivalsAncestorRow[]
}

export type ArrivalsExportPayload = {
  level: ArrivalsDownloadLevel
  churchId: string
  churchName: string
  arrivalDate: string
  detail: ArrivalsDetailRow[]
  vehicles: ArrivalsVehicleRow[]
  summary: ArrivalsSummaryRow[] | null
  summaryAtLevel?: ArrivalsSummaryAtLevelRow[]
  targetLevel?: 'Stream' | 'Council' | 'Governorship'
}

type Column<Row> = {
  header: string
  toCell: (row: Row) => string | number | null
}

const blank = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  return String(value)
}

const numberOrBlank = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

const detailColumns = (
  level: ArrivalsDownloadLevel
): Column<ArrivalsDetailRow>[] => {
  const columns: Column<ArrivalsDetailRow>[] = []
  if (level === 'Stream' || level === 'Campus') {
    columns.push({ header: 'Stream', toCell: (r) => blank(r.stream) })
  }
  if (level === 'Council' || level === 'Stream' || level === 'Campus') {
    columns.push({ header: 'Council', toCell: (r) => blank(r.council) })
  }
  columns.push(
    { header: 'Governorship', toCell: (r) => blank(r.governorship) },
    { header: 'Bacenta', toCell: (r) => blank(r.bacenta) },
    { header: 'Bacenta Leader', toCell: (r) => blank(r.leader) },
    { header: 'Leader Phone', toCell: (r) => blank(r.leaderPhone) },
    { header: 'Leader WhatsApp', toCell: (r) => blank(r.leaderWhatsapp) },
    { header: 'Meeting Day', toCell: (r) => blank(r.meetingDay) },
    { header: 'Vacation Status', toCell: (r) => blank(r.vacationStatus) },
    {
      header: 'Bussing Recorded?',
      toCell: (r) => blank(r.bussingRecorded),
    },
    { header: 'Attendance', toCell: (r) => numberOrBlank(r.attendance) },
    {
      header: 'Leader Declaration',
      toCell: (r) => numberOrBlank(r.leaderDeclaration),
    },
    { header: 'Sprinters', toCell: (r) => numberOrBlank(r.sprinters) },
    { header: 'Urvans', toCell: (r) => numberOrBlank(r.urvans) },
    { header: 'Cars', toCell: (r) => numberOrBlank(r.cars) },
    {
      header: 'Bussing Cost (GHS)',
      toCell: (r) => numberOrBlank(r.bussingCost),
    },
    {
      header: 'Bussing Top-Up (GHS)',
      toCell: (r) => numberOrBlank(r.bussingTopUp),
    }
  )
  return columns
}

const vehicleColumns = (
  level: ArrivalsDownloadLevel
): Column<ArrivalsVehicleRow>[] => {
  const columns: Column<ArrivalsVehicleRow>[] = []
  if (level === 'Stream' || level === 'Campus') {
    columns.push({ header: 'Stream', toCell: (r) => blank(r.stream) })
  }
  if (level === 'Council' || level === 'Stream' || level === 'Campus') {
    columns.push({ header: 'Council', toCell: (r) => blank(r.council) })
  }
  columns.push(
    { header: 'Governorship', toCell: (r) => blank(r.governorship) },
    { header: 'Bacenta', toCell: (r) => blank(r.bacenta) },
    { header: 'Vehicle Type', toCell: (r) => blank(r.vehicleType) },
    { header: 'Direction', toCell: (r) => blank(r.direction) },
    { header: 'Attendance', toCell: (r) => numberOrBlank(r.attendance) },
    {
      header: 'Leader Declaration',
      toCell: (r) => numberOrBlank(r.leaderDeclaration),
    },
    {
      header: 'Vehicle Cost (GHS)',
      toCell: (r) => numberOrBlank(r.vehicleCost),
    },
    {
      header: 'Vehicle Top-Up (GHS)',
      toCell: (r) => numberOrBlank(r.vehicleTopUp),
    },
    {
      header: 'Mobile Network',
      toCell: (r) => blank(r.mobileNetwork),
    },
    {
      header: 'MoMo Number (last 4)',
      toCell: (r) => blank(r.momoNumberMasked),
    },
    {
      header: 'Transaction Status',
      toCell: (r) => blank(r.transactionStatus),
    },
    { header: 'Arrival Time', toCell: (r) => blank(r.arrivalTime) },
    { header: 'Comments', toCell: (r) => blank(r.comments) }
  )
  return columns
}

const summaryColumns = (
  level: ArrivalsDownloadLevel
): Column<ArrivalsSummaryRow>[] => {
  const childLabel: Record<ArrivalsDownloadLevel, string> = {
    Governorship: 'Governorship',
    Council: 'Governorship',
    Stream: 'Council',
    Campus: 'Stream',
  }
  return [
    { header: childLabel[level], toCell: (r) => blank(r.child) },
    { header: 'Leader', toCell: (r) => blank(r.childLeader) },
    {
      header: 'Active Bacentas',
      toCell: (r) => numberOrBlank(r.activeBacentas),
    },
    {
      header: 'Bacentas Bussed',
      toCell: (r) => numberOrBlank(r.bacentasWithBussing),
    },
    {
      header: 'Total Attendance',
      toCell: (r) => numberOrBlank(r.totalAttendance),
    },
    {
      header: 'Total Leader Declaration',
      toCell: (r) => numberOrBlank(r.totalLeaderDeclaration),
    },
    { header: 'Sprinters', toCell: (r) => numberOrBlank(r.totalSprinters) },
    { header: 'Urvans', toCell: (r) => numberOrBlank(r.totalUrvans) },
    { header: 'Cars', toCell: (r) => numberOrBlank(r.totalCars) },
    {
      header: 'Bussing Cost (GHS)',
      toCell: (r) => numberOrBlank(r.totalBussingCost),
    },
    {
      header: 'Bussing Top-Up (GHS)',
      toCell: (r) => numberOrBlank(r.totalBussingTopUp),
    },
  ]
}

const buildAoa = <Row>(
  columns: Column<Row>[],
  rows: Row[]
): (string | number | null)[][] => {
  const headerRow = columns.map((c) => c.header)
  const body = rows.map((row) => columns.map((c) => c.toCell(row)))
  return [headerRow, ...body]
}

const ILLEGAL_FILENAME_CHARS = /[/\\:*?"<>|]/g
const ILLEGAL_SHEET_CHARS = /[\\/?*[\]:]/g

const sanitiseFilename = (name: string): string =>
  name.replace(ILLEGAL_FILENAME_CHARS, '-').trim() || 'export'

const sanitiseSheetName = (name: string): string =>
  name.replace(ILLEGAL_SHEET_CHARS, ' ').slice(0, 31).trim() || 'Sheet'

const csvEscape = (cell: string | number | null): string => {
  if (cell === null) return ''
  const s = String(cell)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const aoaToCsv = (aoa: (string | number | null)[][]): string =>
  aoa.map((row) => row.map(csvEscape).join(',')).join('\r\n')

export type WorkbookOutput = {
  xlsxBlob: Blob
  csvZipBlob: Promise<Blob>
  filenameStem: string
}

export const buildArrivalsWorkbook = (
  payload: ArrivalsExportPayload
): WorkbookOutput => {
  const filenameStem = sanitiseFilename(
    `${payload.churchName} ${payload.level} Arrivals ${payload.arrivalDate}`
  )

  const detailAoa = buildAoa(
    detailColumns(payload.level),
    payload.detail ?? []
  )
  const vehicleAoa = buildAoa(
    vehicleColumns(payload.level),
    payload.vehicles ?? []
  )

  const wb = XLSX.utils.book_new()

  if (payload.summary && payload.summary.length > 0) {
    const summaryAoa = buildAoa(
      summaryColumns(payload.level),
      payload.summary
    )
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryAoa)
    XLSX.utils.book_append_sheet(
      wb,
      summarySheet,
      sanitiseSheetName(`Summary by ${summaryColumns(payload.level)[0].header}`)
    )
  }

  const detailSheet = XLSX.utils.aoa_to_sheet(detailAoa)
  XLSX.utils.book_append_sheet(
    wb,
    detailSheet,
    sanitiseSheetName('Bacenta Detail')
  )

  if (vehicleAoa.length > 1) {
    const vehicleSheet = XLSX.utils.aoa_to_sheet(vehicleAoa)
    XLSX.utils.book_append_sheet(
      wb,
      vehicleSheet,
      sanitiseSheetName('Vehicle Detail')
    )
  }

  const xlsxArrayBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  })
  const xlsxBlob = new Blob([xlsxArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const csvZipBlob = (async () => {
    const zip = new JSZip()
    if (payload.summary && payload.summary.length > 0) {
      const summaryAoa = buildAoa(
        summaryColumns(payload.level),
        payload.summary
      )
      zip.file(`${filenameStem} - Summary.csv`, aoaToCsv(summaryAoa))
    }
    zip.file(`${filenameStem} - Detail.csv`, aoaToCsv(detailAoa))
    if (vehicleAoa.length > 1) {
      zip.file(`${filenameStem} - Vehicles.csv`, aoaToCsv(vehicleAoa))
    }
    return zip.generateAsync({ type: 'blob' })
  })()

  return { xlsxBlob, csvZipBlob, filenameStem }
}
