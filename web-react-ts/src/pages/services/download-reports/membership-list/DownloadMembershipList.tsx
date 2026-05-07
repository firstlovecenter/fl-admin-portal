import { ApolloError } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
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
import { Church, Member } from 'global-types'
import { getHumanReadableDate } from 'global-utils'
import {
  Check,
  ChevronLeft,
  Copy,
  Download,
  FileSpreadsheet,
  Inbox,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { CSVLink } from 'react-csv'
import { useNavigate } from 'react-router-dom'

// Birthdays are formatted day + month only (no year), so we can't reuse
// global-utils' getHumanReadableDate which always includes the year.
const formatBirthday = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

const ILLEGAL_FILENAME_CHARS = /[/\\:*?"<>|]/g

type DownloadMembershipListProps = {
  church: Church
  loading: boolean
  error: ApolloError | undefined
  churchType: string
}

const headers = [
  { label: 'Governorship', key: 'governorship' },
  { label: 'Governorship Leader', key: 'governorshipLeader' },
  { label: 'Bacenta', key: 'bacenta' },
  { label: 'Bacenta Leader', key: 'bacentaLeader' },
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
] as const

type RowKey = (typeof headers)[number]['key']
type Row = { id: string } & Record<RowKey, string>

const buildRows = (church: Church | undefined): Row[] =>
  church?.downloadMembership?.map((member: Member) => ({
    id: member.id,
    governorship: member.bacenta?.governorship?.name ?? '',
    governorshipLeader: member.bacenta?.governorship?.leader?.fullName ?? '',
    bacenta: member.bacenta?.name ?? '',
    bacentaLeader: member.bacenta?.leader?.fullName ?? '',
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
  })) ?? []

const DownloadMembershipList = (props: DownloadMembershipListProps) => {
  const { church, loading, error, churchType } = props
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const rows = buildRows(church)
  const total = rows.length
  const churchName = (church?.name ?? '').replace(ILLEGAL_FILENAME_CHARS, '-')
  const filename = `${
    churchName ? `${churchName} ` : ''
  }${churchType} Membership - ${generatedOn}.csv`

  const copyFilename = async () => {
    try {
      await navigator.clipboard.writeText(filename)
      setCopied(true)
    } catch {
      toast.error('Could not copy filename')
    }
  }

  const previewRows = rows.slice(0, 5)

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-5 lg:max-w-6xl lg:px-6 lg:py-8">
        <header className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="-ml-2 mt-0.5 size-11 shrink-0"
          >
            <ChevronLeft className="size-5" />
          </Button>
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
        </header>

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

                  <section className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Filename
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
                        {filename}
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
                    asChild
                    className="h-12 w-full gap-2 text-base font-semibold"
                  >
                    <CSVLink
                      data={rows}
                      headers={[...headers]}
                      filename={filename}
                      target="_self"
                    >
                      <Download className="size-5" />
                      Download CSV
                    </CSVLink>
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
                        : `Showing ${total} of ${total}`}
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 px-3 text-muted-foreground">
                          #
                        </TableHead>
                        {headers.map((h) => (
                          <TableHead key={h.key} className="px-3">
                            {h.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell className="px-3 font-medium text-muted-foreground tabular-nums">
                            {index + 1}
                          </TableCell>
                          {headers.map((h) => (
                            <TableCell
                              key={h.key}
                              className={
                                h.key === 'phoneNumber' ||
                                h.key === 'whatsappNumber'
                                  ? 'px-3 font-mono tabular-nums'
                                  : 'px-3'
                              }
                            >
                              {row[h.key] || (
                                <span className="text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </section>
              </div>
            )}
          </div>
        </ApolloWrapper>
      </main>
    </div>
  )
}

type StatTileProps = {
  icon: React.ReactNode
  label: string
  value: string
}

const StatTile = ({ icon, label, value }: StatTileProps) => (
  <div className="rounded-lg border border-border bg-background/40 p-3">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <p className="text-xs font-medium uppercase tracking-wider">{label}</p>
    </div>
    <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">
      {value}
    </p>
  </div>
)

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
