import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from 'components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'
import useSelectedWeek from 'hooks/useSelectedWeek'
import { getAccessToken } from 'lib/auth-service'

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

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

type Format = 'xlsx' | 'csv-zip'

type DownloadDefaultersButtonProps = {
  level: DefaultersDownloadLevel
  churchId: string | undefined
  // Disabled when the parent's church query is still loading or errored.
  disabled?: boolean
  className?: string
}

const DownloadDefaultersButton = ({
  level,
  churchId,
  disabled,
  className,
}: DownloadDefaultersButtonProps) => {
  const { weekStart, isCurrent, weekShortLabel } = useSelectedWeek()
  const [pending, setPending] = useState<Format | null>(null)

  const handleDownload = async (format: Format) => {
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
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Download failed (${res.status})`)
      }
      const payload = (await res.json()) as DefaultersExportPayload
      if (!payload.detail || payload.detail.length === 0) {
        toast.info('No defaulters data to download for the selected week.')
        return
      }
      const built = buildDefaultersWorkbook(payload, weekShortLabel)
      if (format === 'xlsx') {
        triggerBlobDownload(built.xlsxBlob, `${built.filenameStem}.xlsx`)
      } else {
        const zipBlob = await built.csvZipBlob
        triggerBlobDownload(zipBlob, `${built.filenameStem}.zip`)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not download defaulters'
      toast.error(message)
    } finally {
      setPending(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || pending !== null || !churchId}
          aria-label="Download defaulters list"
          className={className}
        >
          {pending !== null ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Download />
          )}
          <span className="hidden lg:inline">Download</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            handleDownload('xlsx')
          }}
        >
          <FileSpreadsheet />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            handleDownload('csv-zip')
          }}
        >
          <FileText />
          CSV (.zip)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DownloadDefaultersButton
