import { useEffect, useMemo, useState } from 'react'
import { DocumentNode, useLazyQuery } from '@apollo/client'
import {
  DISPLAY_BACENTA_MEMBERSHIP,
  DISPLAY_CAMPUS_MEMBERSHIP,
  DISPLAY_COUNCIL_MEMBERSHIP,
  DISPLAY_FELLOWSHIP_MEMBERSHIP,
  DISPLAY_GOVERNORSHIP_MEMBERSHIP,
  DISPLAY_OVERSIGHT_MEMBERSHIP,
  DISPLAY_STREAM_MEMBERSHIP,
} from './download-membership.gql'
import { Member } from 'global-types'
import { CSVLink } from 'react-csv'
import { Check, Copy, Download, FileSpreadsheet, Inbox, Users } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from 'components/ui/sheet'
import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
import { Badge } from 'components/ui/badge'
import { Separator } from 'components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table'
import { cn } from 'components/lib/utils'

import { memberFilter } from './member-filter-utils'
import {
  buildCsvFilename,
  buildCsvRow,
  csvHeaders,
} from './download-csv-helpers'

export type DownloadableLevel =
  | 'Fellowship'
  | 'Bacenta'
  | 'Governorship'
  | 'Council'
  | 'Stream'
  | 'Campus'
  | 'Oversight'

const QUERY_BY_LEVEL: Record<DownloadableLevel, DocumentNode> = {
  Fellowship: DISPLAY_FELLOWSHIP_MEMBERSHIP,
  Bacenta: DISPLAY_BACENTA_MEMBERSHIP,
  Governorship: DISPLAY_GOVERNORSHIP_MEMBERSHIP,
  Council: DISPLAY_COUNCIL_MEMBERSHIP,
  Stream: DISPLAY_STREAM_MEMBERSHIP,
  Campus: DISPLAY_CAMPUS_MEMBERSHIP,
  Oversight: DISPLAY_OVERSIGHT_MEMBERSHIP,
}

const DATA_KEY_BY_LEVEL: Record<DownloadableLevel, string> = {
  Fellowship: 'fellowships',
  Bacenta: 'bacentas',
  Governorship: 'governorships',
  Council: 'councils',
  Stream: 'streams',
  Campus: 'campuses',
  Oversight: 'oversights',
}

type Filters = {
  gender: string[]
  maritalStatus: string[]
  occupation: string
  leaderTitle: string[]
  leaderRank: string[]
  basonta: string[]
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  level: DownloadableLevel
  churchId: string
  churchName?: string
  filters: Filters
  searchTerm: string
  isDesktop: boolean
}

const filterSummary = (filters: Filters, searchTerm: string): string[] => {
  const chips: string[] = []
  if (searchTerm.trim()) chips.push(`Name: "${searchTerm.trim()}"`)
  if (filters.gender?.length) chips.push(`Gender: ${filters.gender.join(', ')}`)
  if (filters.maritalStatus?.length)
    chips.push(`Marital: ${filters.maritalStatus.join(', ')}`)
  if (filters.leaderTitle?.length)
    chips.push(`Title: ${filters.leaderTitle.join(', ')}`)
  if (filters.leaderRank?.length)
    chips.push(`Rank: ${filters.leaderRank.join(', ')}`)
  if (filters.basonta?.length)
    chips.push(`Basonta: ${filters.basonta.join(', ')}`)
  return chips
}

const DownloadMembershipModal = ({
  open,
  onOpenChange,
  level,
  churchId,
  churchName,
  filters,
  searchTerm,
  isDesktop,
}: Props) => {
  const [copied, setCopied] = useState(false)

  const [loadMembership, { data, loading, error }] = useLazyQuery(
    QUERY_BY_LEVEL[level],
    { fetchPolicy: 'cache-first' }
  )

  useEffect(() => {
    if (!open || !churchId) return
    loadMembership({ variables: { id: churchId } })
  }, [open, churchId, loadMembership])

  useEffect(() => {
    if (!copied) return undefined
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const rawMembers: Member[] =
    data?.[DATA_KEY_BY_LEVEL[level]]?.[0]?.downloadMembership ?? []
  // React-keys the preview rows on member.id, so guard upstream.
  const allMembers = useMemo(
    () => rawMembers.filter((m) => !!m?.id),
    [rawMembers]
  )

  const filteredMembers = useMemo(() => {
    if (!allMembers.length) return [] as Member[]
    const filtered = (memberFilter(allMembers, filters) ?? []) as Member[]
    if (!searchTerm.trim()) return filtered
    const needle = searchTerm.toLowerCase()
    return filtered.filter((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(needle)
    )
  }, [allMembers, filters, searchTerm])

  const rows = useMemo(() => filteredMembers.map(buildCsvRow), [filteredMembers])

  const total = allMembers.length
  const filteredCount = rows.length
  const { filename, generatedOn } = useMemo(
    () =>
      buildCsvFilename({
        churchName,
        churchType: level,
        filteredCount,
        totalCount: total,
      }),
    [churchName, level, filteredCount, total]
  )

  const PREVIEW_LIMIT = 5
  const previewRows = rows.slice(0, PREVIEW_LIMIT)
  const chips = filterSummary(filters, searchTerm)

  const copyFilename = async () => {
    try {
      await navigator.clipboard.writeText(filename)
      setCopied(true)
    } catch {
      toast.error('Could not copy filename')
    }
  }

  const downloadButton = (
    <div className="flex justify-center">
      <Button
        asChild
        disabled={loading || filteredCount === 0}
        className={cn(
          'h-11 gap-2 px-6 text-sm font-semibold',
          (loading || filteredCount === 0) && 'pointer-events-none opacity-50'
        )}
      >
        {loading || filteredCount === 0 ? (
          <span>
            <Download className="size-4" />
            Download CSV
          </span>
        ) : (
          <CSVLink
            data={rows}
            headers={[...csvHeaders]}
            filename={filename}
            target="_self"
            onClick={() => {
              // Defer the close so Android WebView / iOS PWA can start the
              // synthetic <a download> click before the parent unmounts it.
              setTimeout(() => onOpenChange(false), 250)
            }}
          >
            <Download className="size-4" />
            Download CSV
            <span className="text-xs font-normal opacity-80 tabular-nums">
              · {filteredCount.toLocaleString('en-GH')} rows
            </span>
          </CSVLink>
        )}
      </Button>
    </div>
  )

  const body = (
    <div className="space-y-4">
      {/* Active filters */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Filters applied
        </p>
        {chips.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No filters — exporting the full list.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <Badge key={c} variant="secondary" className="font-normal">
                {c}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3">
        <StatTile
          icon={<Users className="size-4" />}
          label={chips.length ? 'Filtered' : 'Total'}
          value={
            loading
              ? '—'
              : chips.length
              ? `${filteredCount.toLocaleString('en-GH')} of ${total.toLocaleString('en-GH')}`
              : total.toLocaleString('en-GH')
          }
        />
        <StatTile
          icon={<Download className="size-4" />}
          label="Generated"
          value={generatedOn}
        />
      </section>

      {/* Filename */}
      <section className="rounded-xl border border-border bg-muted/30 p-3">
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
            aria-label={copied ? 'Filename copied' : 'Copy filename'}
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

      {/* Body — loading / error / empty / preview */}
      {loading ? (
        <PreviewSkeleton />
      ) : error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Could not load membership. Please try again.
        </p>
      ) : filteredCount === 0 ? (
        <EmptyPreview hasTotal={total > 0} />
      ) : (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preview
            </h3>
            <p className="text-xs text-muted-foreground tabular-nums">
              {filteredCount > previewRows.length
                ? `First ${previewRows.length} of ${filteredCount.toLocaleString('en-GH')}`
                : `${filteredCount} of ${filteredCount}`}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 px-3 text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="px-3">First Name</TableHead>
                  <TableHead className="px-3">Last Name</TableHead>
                  <TableHead className="px-3">Bacenta</TableHead>
                  <TableHead className="px-3 hidden md:table-cell">
                    Gender
                  </TableHead>
                  <TableHead className="px-3 hidden md:table-cell">
                    Marital
                  </TableHead>
                  <TableHead className="px-3">Phone</TableHead>
                  <TableHead className="px-3 hidden lg:table-cell">
                    Email
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-3 font-medium text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-3">{row.firstName || '—'}</TableCell>
                    <TableCell className="px-3">{row.lastName || '—'}</TableCell>
                    <TableCell className="px-3">{row.bacenta || '—'}</TableCell>
                    <TableCell className="px-3 hidden md:table-cell">
                      {row.gender || '—'}
                    </TableCell>
                    <TableCell className="px-3 hidden md:table-cell">
                      {row.maritalStatus || '—'}
                    </TableCell>
                    <TableCell className="px-3 font-mono tabular-nums">
                      {row.phoneNumber || '—'}
                    </TableCell>
                    <TableCell className="px-3 hidden lg:table-cell truncate max-w-[260px]">
                      {row.email || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-banking" />
              Download Membership
            </DialogTitle>
            <DialogDescription>
              Export the {level.toLowerCase()} membership list as a CSV. The
              filters and search you have on screen are applied to the export.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {body}
          </div>
          <div className="border-t border-border bg-background px-6 py-4">
            {downloadButton}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-t-2xl p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-banking" />
            Download Membership
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{body}</div>
        <div className="border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {downloadButton}
        </div>
      </SheetContent>
    </Sheet>
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

const PreviewSkeleton = () => (
  <section className="space-y-3">
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-32 w-full rounded-md" />
    <Skeleton className="h-12 w-full rounded-md" />
  </section>
)

const EmptyPreview = ({ hasTotal }: { hasTotal: boolean }) => (
  <section className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-8 text-center">
    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Inbox className="size-6" />
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-foreground">
        {hasTotal ? 'No members match these filters' : 'No members yet'}
      </h3>
      <p className="text-xs text-muted-foreground">
        {hasTotal
          ? 'Clear or change the filters to include more members.'
          : "There's nothing to export for this church."}
      </p>
    </div>
  </section>
)

export default DownloadMembershipModal
