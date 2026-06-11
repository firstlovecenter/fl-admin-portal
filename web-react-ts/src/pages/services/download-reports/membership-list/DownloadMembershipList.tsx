import { ApolloError } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table'
import { Church, ChurchLevel, Member } from 'global-types'
import { getDescendantLevels, getHumanReadableDate } from 'global-utils'
import { getAccessToken } from 'lib/auth-service'
import AncestorLevelPicker from './AncestorLevelPicker'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ChevronsUpDown,
  Copy,
  Download,
  FileSpreadsheet,
  Inbox,
  Loader2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import StatTile from 'pages/reports/_shared/StatTile'
import { sanitizeFilenamePart } from 'pages/reports/_shared/WeeklyReportDownloadCard'

const formatBirthday = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

// Mirrors the server's filename builder so the user sees the same name in
// the "Filename" panel before downloading. The browser still uses whatever
// Content-Disposition the server returns; this is display-only.
const buildDisplayFilename = (churchName: string, churchType: string) => {
  const today = new Date().toISOString().slice(0, 10)
  const safeName = sanitizeFilenamePart(churchName || churchType)
  return `${safeName} ${churchType} Membership - ${today}.csv`
}

// Mirrors the backend's `ANCESTOR_LEVELS` order in
// `api/src/resolvers/downloads/downloads-handler.ts`. Keep these two in
// lockstep — adding a level here without a Cypher RETURN binding emits
// blank columns; the reverse silently drops a column from the export.
// Denomination is omitted because the Cypher RETURN doesn't expose it.
const TICKABLE_LEVELS: ReadonlyArray<ChurchLevel> = [
  'Oversight',
  'Campus',
  'Stream',
  'Council',
  'Governorship',
  'Bacenta',
]

type ColumnDef = { key: string; label: string }

const IDENTITY_COLUMNS: ReadonlyArray<ColumnDef> = [
  { label: 'First Name', key: 'firstName' },
  { label: 'Last Name', key: 'lastName' },
  { label: 'Phone Number', key: 'phoneNumber' },
  { label: 'Whatsapp Number', key: 'whatsappNumber' },
  { label: 'Email', key: 'email' },
  { label: 'Marital Status', key: 'maritalStatus' },
  { label: 'Gender', key: 'gender' },
  { label: 'Date of Birth', key: 'dateOfBirth' },
  { label: 'Visitation Area', key: 'visitationArea' },
  { label: 'Basonta', key: 'basonta' },
]

const lowerFirst = (s: string) =>
  s.length === 0 ? s : s[0].toLowerCase() + s.slice(1)

const ancestorColumnsFor = (level: ChurchLevel): ColumnDef[] => {
  const k = lowerFirst(level)
  return [
    { key: k, label: level },
    { key: `${k}Leader`, label: `${level} Leader` },
    { key: `${k}LeaderPhone`, label: `${level} Leader Phone` },
  ]
}

const buildPreviewHeaders = (selected: ChurchLevel[]): ColumnDef[] => {
  const set = new Set(selected)
  const ancestors = TICKABLE_LEVELS.filter((l) => set.has(l)).flatMap(
    ancestorColumnsFor
  )
  return [...ancestors, ...IDENTITY_COLUMNS]
}

type PreviewRow = { id: string } & Record<string, string>

const columnHelper = createColumnHelper<PreviewRow>()

const buildPreviewRows = (church: Church | undefined): PreviewRow[] =>
  church?.members?.map((member: Member) => {
    const { bacenta } = member
    const governorship = bacenta?.governorship
    const council = governorship?.council
    const stream = council?.stream
    const campus = stream?.campus
    const oversight = campus?.oversight

    return {
      id: member.id,
      oversight: oversight?.name ?? '',
      oversightLeader: oversight?.leader?.fullName ?? '',
      oversightLeaderPhone: oversight?.leader?.phoneNumber ?? '',
      campus: campus?.name ?? '',
      campusLeader: campus?.leader?.fullName ?? '',
      campusLeaderPhone: campus?.leader?.phoneNumber ?? '',
      stream: stream?.name ?? '',
      streamLeader: stream?.leader?.fullName ?? '',
      streamLeaderPhone: stream?.leader?.phoneNumber ?? '',
      council: council?.name ?? '',
      councilLeader: council?.leader?.fullName ?? '',
      councilLeaderPhone: council?.leader?.phoneNumber ?? '',
      governorship: governorship?.name ?? '',
      governorshipLeader: governorship?.leader?.fullName ?? '',
      governorshipLeaderPhone: governorship?.leader?.phoneNumber ?? '',
      bacenta: bacenta?.name ?? '',
      bacentaLeader: bacenta?.leader?.fullName ?? '',
      bacentaLeaderPhone: bacenta?.leader?.phoneNumber ?? '',
      firstName: member.firstName ?? '',
      lastName: member.lastName ?? '',
      phoneNumber: member.phoneNumber ?? '',
      whatsappNumber: member.whatsappNumber ?? '',
      email: member.email ?? '',
      maritalStatus: member.maritalStatus?.status ?? '',
      gender: member.gender?.gender ?? '',
      dateOfBirth: formatBirthday(member.dob?.date),
      visitationArea: member.visitationArea ?? '',
      basonta: member.basonta?.name ?? '',
    }
  }) ?? []

const filenameFromContentDisposition = (
  header: string | null
): string | undefined => {
  if (!header) return undefined
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim())
    } catch {
      /* fall through to plain filename */
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i)
  return plain?.[1]?.trim()
}

const buildDownloadUrl = (
  level: string,
  churchId: string,
  selectedLevels: ChurchLevel[]
): string => {
  // Match the absolute fallback used in src/index.tsx so a dev without
  // VITE_SYNAGO_GRAPHQL_URI set still hits the API on :4001 and not the
  // Vite dev server on :3000. The download endpoint sits at the same host
  // as `/graphql`, so we derive its base by stripping the GraphQL path.
  const graphqlUri =
    import.meta.env.VITE_SYNAGO_GRAPHQL_URI || 'http://localhost:4001/graphql'
  const apiBase = graphqlUri.replace(/\/graphql\/?$/, '')
  const base = `${apiBase}/downloads/membership/${encodeURIComponent(
    level
  )}/${encodeURIComponent(churchId)}.csv`
  // Empty selection (Bacenta scope) becomes `?levels=` — handler treats
  // that as "no ancestor columns" rather than falling back to the legacy
  // default, which is what the user explicitly asked for via the picker.
  const params = new URLSearchParams({ levels: selectedLevels.join(',') })
  return `${base}?${params.toString()}`
}

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Revoke after the download has had a chance to start. Some mobile
  // PWAs need the URL to live a bit past the click().
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

const SortIcon = ({ sorted }: { sorted: 'asc' | 'desc' | false }) => {
  if (sorted === 'asc') return <ChevronUp className="size-3.5 shrink-0" />
  if (sorted === 'desc') return <ChevronDown className="size-3.5 shrink-0" />
  return <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />
}

type DownloadMembershipListProps = {
  church: Church
  loading: boolean
  error: ApolloError | undefined
  churchType: string
}

const DownloadMembershipList = (props: DownloadMembershipListProps) => {
  const { church, loading, error, churchType } = props
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Levels the user can tick = descendants of the current scope. Bacenta
  // scope returns [], which collapses the picker and yields an
  // identity-only CSV (no ancestor church columns). Each per-level page
  // (DownloadOversightMembership, …) hardcodes its own churchType, so
  // this initializer never reseeds on re-render — no resync effect
  // needed.
  const availableLevels = useMemo(
    () => getDescendantLevels(churchType as ChurchLevel),
    [churchType]
  )
  const [selectedLevels, setSelectedLevels] =
    useState<ChurchLevel[]>(availableLevels)

  useEffect(() => {
    if (!copied) return undefined
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const [sorting, setSorting] = useState<SortingState>([])

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const previewRows = useMemo(() => buildPreviewRows(church), [church])
  const total = church?.memberCount ?? 0
  const displayFilename = buildDisplayFilename(church?.name ?? '', churchType)
  const previewHeaders = useMemo(
    () => buildPreviewHeaders(selectedLevels),
    [selectedLevels]
  )

  const previewTableColumns = useMemo(
    () => [
      columnHelper.display({
        id: 'index',
        header: '#',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {row.index + 1}
          </span>
        ),
      }),
      ...previewHeaders.map((h) =>
        columnHelper.accessor(h.key, {
          header: h.label,
          cell: (info) => {
            const v = info.getValue()
            return v || <span className="text-muted-foreground">—</span>
          },
        })
      ),
    ],
    [previewHeaders]
  )

  const memberTable = useReactTable({
    data: previewRows,
    columns: previewTableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const copyFilename = async () => {
    try {
      await navigator.clipboard.writeText(displayFilename)
      setCopied(true)
    } catch {
      toast.error('Could not copy filename')
    }
  }

  const handleDownload = async () => {
    if (!church?.id) return
    const token = getAccessToken()
    if (!token) {
      toast.error('Sign in expired. Please sign in again.')
      return
    }

    setDownloading(true)
    try {
      const res = await fetch(
        buildDownloadUrl(churchType, church.id, selectedLevels),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Download failed (${res.status})`)
      }
      const blob = await res.blob()
      const serverName = filenameFromContentDisposition(
        res.headers.get('Content-Disposition')
      )
      triggerBlobDownload(blob, serverName ?? displayFilename)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not download membership'
      toast.error(message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader>
        <div className="min-w-0 flex-1 space-y-1">
          {loading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {church?.name ?? '—'}{' '}
              <span className="text-members">Members</span>
            </h1>
          )}
        </div>
      </StickyPageHeader>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-5 lg:max-w-6xl lg:px-6 lg:py-8">
        <ApolloWrapper data={church} loading={loading} error={error} placeholder>
          <div className="space-y-6">
            {loading ? (
              <LoadingSkeleton />
            ) : total === 0 ? (
              <EmptyState onBack={() => navigate(-1)} />
            ) : (
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-6">
                {/* LEFT — action panel */}
                <div className="flex flex-col gap-6 lg:sticky lg:top-6">
                  <section className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-members/10 text-members">
                        <FileSpreadsheet className="size-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-foreground">
                          Membership list ready
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Export the full {churchType.toLowerCase()}{' '}
                          membership as a CSV file.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <StatTile
                        icon={<Users className="size-4" />}
                        label="Total Members"
                        value={total.toLocaleString('en-GH')}
                      />
                      <StatTile
                        icon={<Download className="size-4" />}
                        label="Generated"
                        value={generatedOn}
                      />
                    </div>
                  </section>

                  <AncestorLevelPicker
                    availableLevels={availableLevels}
                    selectedLevels={selectedLevels}
                    onChange={setSelectedLevels}
                  />

                  <section className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Filename
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
                        {displayFilename}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={copyFilename}
                        aria-label={
                          copied ? 'Filename copied' : 'Copy filename'
                        }
                        className="size-11 shrink-0"
                      >
                        {copied ? (
                          <Check className="size-4 text-success" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </section>

                  <Button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading || !church?.id}
                    className="h-12 w-full gap-2 text-base font-semibold"
                  >
                    {downloading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Download className="size-5" />
                    )}
                    {downloading ? 'Generating…' : 'Download CSV'}
                  </Button>
                </div>

                {/* RIGHT — preview */}
                <section className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Preview
                    </h3>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {total > previewRows.length
                        ? `Showing first ${previewRows.length} of ${total.toLocaleString(
                            'en-GH'
                          )}`
                        : `Showing ${previewRows.length} of ${total}`}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      {memberTable.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                          key={headerGroup.id}
                          className="border-b border-border hover:bg-transparent"
                        >
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="px-3 py-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                              {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    header.column.getToggleSortingHandler()?.(e)
                                  }
                                  className="-ml-1 flex min-h-11 items-center gap-1 rounded px-1 transition-colors hover:text-foreground"
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                  <SortIcon sorted={header.column.getIsSorted()} />
                                </button>
                              ) : (
                                <div className="flex min-h-11 items-center">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </div>
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {memberTable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="border-b border-border">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="px-3 py-3 text-sm">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </section>
              </div>
            )}
          </div>
        </ApolloWrapper>
      </main>
    </div>
  )
}

const LoadingSkeleton = () => (
  <>
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Skeleton className="h-[68px] rounded-lg" />
        <Skeleton className="h-[68px] rounded-lg" />
      </div>
    </section>
    <Skeleton className="h-12 w-full rounded-md" />
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-32 w-full" />
    </section>
  </>
)

const EmptyState = ({ onBack }: { onBack: () => void }) => (
  <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
    <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Inbox className="size-7" />
    </div>
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-foreground">
        No membership records yet
      </h2>
      <p className="text-sm text-muted-foreground">
        There&apos;s nothing to export for this church. Add members first, then
        come back to download.
      </p>
    </div>
    <Button variant="outline" onClick={onBack} className="min-h-[44px] gap-2">
      <ChevronLeft className="size-4" />
      Go back
    </Button>
  </section>
)

export default DownloadMembershipList
