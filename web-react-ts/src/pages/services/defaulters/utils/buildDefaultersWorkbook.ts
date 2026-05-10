import JSZip from 'jszip'
import * as XLSX from 'xlsx'

export type DefaultersDownloadLevel =
  | 'Governorship'
  | 'Council'
  | 'Stream'
  | 'Campus'

const DOWNLOADABLE_LEVELS: ReadonlyArray<DefaultersDownloadLevel> = [
  'Governorship',
  'Council',
  'Stream',
  'Campus',
]

export const isDefaultersDownloadLevel = (
  level: string | null | undefined
): level is DefaultersDownloadLevel =>
  !!level && (DOWNLOADABLE_LEVELS as readonly string[]).includes(level)

export type DefaultersDetailRow = {
  stream?: string | null
  council?: string | null
  governorship?: string | null
  bacenta?: string | null
  leader?: string | null
  leaderPhone?: string | null
  leaderWhatsapp?: string | null
  meetingDay?: string | null
  vacationStatus?: string | null
  serviceHeld?: string | null
  cancellationReason?: string | null
  serviceDate?: string | null
  attendance?: number | null
  income?: number | null
  foreignCurrency?: string | null
  formSubmitted?: string | null
  bankingStatus?: string | null
  [key: string]: unknown
}

export type DefaultersSummaryRow = {
  child?: string | null
  childLeader?: string | null
  activeBacentas?: number | null
  servicesFiled?: number | null
  cancelled?: number | null
  banked?: number | null
  bankingDefaulters?: number | null
  formDefaulters?: number | null
  [key: string]: unknown
}

export type DefaultersExportPayload = {
  level: DefaultersDownloadLevel
  churchId: string
  churchName: string
  weekStart: string | null
  detail: DefaultersDetailRow[]
  summary: DefaultersSummaryRow[] | null
}

type Column<Row> = {
  header: string
  // The order of `rows.map(toCell)` is the column order in both the
  // XLSX sheet and the per-sheet CSV.
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

// `Stream` shows for Council+, `Council` shows for Stream+, etc. Levels lower
// than the given one don't have meaningful values for those columns, so we
// skip them in the spreadsheet header to avoid confusing empty columns.
const detailColumns = (
  level: DefaultersDownloadLevel
): Column<DefaultersDetailRow>[] => {
  const columns: Column<DefaultersDetailRow>[] = []

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
    { header: 'Service Held?', toCell: (r) => blank(r.serviceHeld) },
    {
      header: 'Cancellation Reason',
      toCell: (r) => blank(r.cancellationReason),
    },
    { header: 'Service Date', toCell: (r) => blank(r.serviceDate) },
    { header: 'Form Submitted?', toCell: (r) => blank(r.formSubmitted) },
    { header: 'Banked?', toCell: (r) => blank(r.bankingStatus) },
    { header: 'Attendance', toCell: (r) => numberOrBlank(r.attendance) },
    { header: 'Income (GHS)', toCell: (r) => numberOrBlank(r.income) },
    {
      header: 'Foreign Currency',
      toCell: (r) => blank(r.foreignCurrency),
    }
  )
  return columns
}

const summaryColumns = (
  level: DefaultersDownloadLevel
): Column<DefaultersSummaryRow>[] => {
  const childLabel: Record<DefaultersDownloadLevel, string> = {
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
      header: 'Services Filed',
      toCell: (r) => numberOrBlank(r.servicesFiled),
    },
    {
      header: 'Form Defaulters',
      toCell: (r) => numberOrBlank(r.formDefaulters),
    },
    { header: 'Banked', toCell: (r) => numberOrBlank(r.banked) },
    {
      header: 'Banking Defaulters',
      toCell: (r) => numberOrBlank(r.bankingDefaulters),
    },
    { header: 'Cancelled', toCell: (r) => numberOrBlank(r.cancelled) },
  ]
}

const buildAoa = <Row,>(
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

// Excel caps sheet names at 31 chars and forbids `\ / ? * [ ] :`.
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

export const buildDefaultersWorkbook = (
  payload: DefaultersExportPayload,
  weekLabel: string
): WorkbookOutput => {
  const filenameStem = sanitiseFilename(
    `${payload.churchName} ${payload.level} Defaulters ${weekLabel}`
  )

  const detailAoa = buildAoa(
    detailColumns(payload.level),
    payload.detail ?? []
  )

  const wb = XLSX.utils.book_new()

  // Summary sheet first when present so council+ users see the rollup before
  // drilling into the per-Bacenta detail.
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

  const xlsxArrayBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  })
  const xlsxBlob = new Blob([xlsxArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  // Defer ZIP build until the user asks for CSV — the XLSX path is the
  // primary branch and we don't want to pay the JSZip cost twice.
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
    return zip.generateAsync({ type: 'blob' })
  })()

  return { xlsxBlob, csvZipBlob, filenameStem }
}
