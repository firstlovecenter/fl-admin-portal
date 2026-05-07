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
import { getAccessToken } from 'lib/auth-service'
import {
  Check,
  ChevronLeft,
  Copy,
  Download,
  FileSpreadsheet,
  Inbox,
  Loader2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const formatBirthday = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

const ILLEGAL_FILENAME_CHARS = /[/\\:*?"<>|]/g

// Mirrors the server's filename builder so the user sees the same name in
// the "Filename" panel before downloading. The browser still uses whatever
// Content-Disposition the server returns; this is display-only.
const buildDisplayFilename = (churchName: string, churchType: string) => {
  const today = new Date().toISOString().slice(0, 10)
  const safeName = (churchName || churchType).replace(
    ILLEGAL_FILENAME_CHARS,
    '-'
  )
  return `${safeName} ${churchType} Membership - ${today}.csv`
}

const previewHeaders = [
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

type PreviewKey = (typeof previewHeaders)[number]['key']
type PreviewRow = { id: string } & Record<PreviewKey, string>

const buildPreviewRows = (church: Church | undefined): PreviewRow[] =>
  church?.members?.map((member: Member) => ({
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

const buildDownloadUrl = (level: string, churchId: string): string => {
  // Match the absolute fallback used in src/index.tsx so a dev without
  // VITE_SYNAGO_GRAPHQL_URI set still hits the API on :4001 and not the
  // Vite dev server on :3000. The download endpoint sits at the same host
  // as `/graphql`, so we derive its base by stripping the GraphQL path.
  const graphqlUri =
    import.meta.env.VITE_SYNAGO_GRAPHQL_URI || 'http://localhost:4001/graphql'
  const apiBase = graphqlUri.replace(/\/graphql\/?$/, '')
  return `${apiBase}/downloads/membership/${encodeURIComponent(
    level
  )}/${encodeURIComponent(churchId)}.csv`
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

  useEffect(() => {
    if (!copied) return undefined
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const previewRows = buildPreviewRows(church)
  const total = church?.memberCount ?? 0
  const displayFilename = buildDisplayFilename(church?.name ?? '', churchType)

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
      const res = await fetch(buildDownloadUrl(churchType, church.id), {
        headers: { Authorization: `Bearer ${token}` },
      })
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
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-5 lg:max-w-6xl lg:px-6 lg:py-8">
        <header className="flex items-start gap-3">
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 px-3 text-muted-foreground">
                          #
                        </TableHead>
                        {previewHeaders.map((h) => (
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
                          {previewHeaders.map((h) => (
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
