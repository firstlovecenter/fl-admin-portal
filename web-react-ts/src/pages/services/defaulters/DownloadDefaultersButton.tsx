import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from 'components/ui/button'
import useSelectedWeek from 'hooks/useSelectedWeek'
import { getAccessToken } from 'lib/auth-service'
import DownloadFormatDialog, {
  type DownloadFormatOption,
} from 'pages/reports/_shared/DownloadFormatDialog'
import { triggerBlobDownload } from 'pages/reports/_shared/triggerBlobDownload'

import {
  buildDefaultersWorkbook,
  DefaultersDownloadLevel,
  DefaultersExportPayload,
} from './utils/buildDefaultersWorkbook'

const buildDownloadUrl = (
  level: DefaultersDownloadLevel,
  churchId: string,
  weekStart: string,
  isCurrent: boolean
): string => {
  const graphqlUri =
    import.meta.env.VITE_SYNAGO_GRAPHQL_URI || 'http://localhost:4001/graphql'
  const apiBase = graphqlUri.replace(/\/graphql\/?$/, '')
  const params = new URLSearchParams()
  // Only send `weekStart` for past weeks. Omitting it on the current week
  // lets the server use `date()` directly and matches what the dashboard
  // queries are doing.
  if (!isCurrent) params.set('weekStart', weekStart)
  const qs = params.toString()
  return `${apiBase}/downloads/defaulters/${encodeURIComponent(
    level
  )}/${encodeURIComponent(churchId)}.json${qs ? `?${qs}` : ''}`
}

type Format = 'xlsx' | 'csv-zip'

const FORMATS: ReadonlyArray<DownloadFormatOption<Format>> = [
  {
    id: 'xlsx',
    label: 'Excel (.xlsx)',
    description:
      'Multi-sheet workbook with the per-Bacenta breakdown and a sub-church summary.',
    icon: FileSpreadsheet,
  },
  {
    id: 'csv-zip',
    label: 'CSV (.zip)',
    description: 'One CSV per sheet, bundled into a single zip file.',
    icon: FileText,
  },
]

type DownloadDefaultersButtonProps = {
  level: DefaultersDownloadLevel
  churchId: string | undefined
  // Disabled when the parent's church query is still loading or errored.
  disabled?: boolean
  className?: string
  /**
   * When true the "Download" label is always visible. Default (false)
   * matches dashboard usage where space is tight and only the icon
   * shows below `lg`.
   */
  showLabel?: boolean
}

const DownloadDefaultersButton = ({
  level,
  churchId,
  disabled,
  className,
  showLabel = false,
}: DownloadDefaultersButtonProps) => {
  const { weekStart, isCurrent, weekShortLabel } = useSelectedWeek()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<Format | null>(null)

  const handleSelect = async (format: Format) => {
    if (!churchId) return
    const token = getAccessToken()
    if (!token) {
      toast.error('Sign in expired. Please sign in again.')
      return
    }

    setPending(format)
    try {
      const res = await fetch(
        buildDownloadUrl(level, churchId, weekStart, isCurrent),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(
          typeof body.error === 'string'
            ? body.error
            : `Download failed (${res.status})`
        )
      }
      const payload = (await res.json()) as DefaultersExportPayload
      if (!payload.detail || payload.detail.length === 0) {
        toast.info('No defaulters data to download for the selected week.')
        setOpen(false)
        return
      }
      const built = buildDefaultersWorkbook(payload, weekShortLabel)
      if (format === 'xlsx') {
        triggerBlobDownload(built.xlsxBlob, `${built.filenameStem}.xlsx`)
      } else {
        const zipBlob = await built.csvZipBlob
        triggerBlobDownload(zipBlob, `${built.filenameStem}.zip`)
      }
      setOpen(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not download defaulters'
      toast.error(message)
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={showLabel ? 'default' : 'outline'}
        size={showLabel ? 'default' : 'sm'}
        disabled={disabled || pending !== null || !churchId}
        aria-label="Download defaulters list"
        aria-busy={pending !== null}
        className={className}
        onClick={() => setOpen(true)}
      >
        {pending !== null ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span className="sr-only">Downloading…</span>
          </>
        ) : (
          <Download aria-hidden="true" />
        )}
        <span className={showLabel ? '' : 'hidden lg:inline'}>Download</span>
      </Button>
      <DownloadFormatDialog
        open={open}
        onOpenChange={setOpen}
        title="Download defaulters"
        description="Choose a file format. The full report includes every Bacenta in scope for the selected week."
        formats={FORMATS}
        pending={pending}
        onSelect={handleSelect}
        accent="defaulters"
      />
    </>
  )
}

export default DownloadDefaultersButton
