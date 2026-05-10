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
import useSelectedArrivalDate from 'hooks/useSelectedArrivalDate'
import { getAccessToken } from 'lib/auth-service'

import {
  ArrivalsDownloadLevel,
  ArrivalsExportPayload,
  buildArrivalsWorkbook,
} from './utils/buildArrivalsWorkbook'

const buildDownloadUrl = (
  level: ArrivalsDownloadLevel,
  churchId: string,
  arrivalDate: string
): string => {
  const graphqlUri =
    import.meta.env.VITE_SYNAGO_GRAPHQL_URI || 'http://localhost:4001/graphql'
  const apiBase = graphqlUri.replace(/\/graphql\/?$/, '')
  const params = new URLSearchParams()
  params.set('arrivalDate', arrivalDate)
  return `${apiBase}/downloads/arrivals/${encodeURIComponent(
    level
  )}/${encodeURIComponent(churchId)}.json?${params.toString()}`
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

type DownloadArrivalsButtonProps = {
  level: ArrivalsDownloadLevel
  churchId: string | undefined
  disabled?: boolean
  className?: string
}

const DownloadArrivalsButton = ({
  level,
  churchId,
  disabled,
  className,
}: DownloadArrivalsButtonProps) => {
  const { arrivalDate } = useSelectedArrivalDate()
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
      const res = await fetch(buildDownloadUrl(level, churchId, arrivalDate), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Download failed (${res.status})`)
      }
      const payload = (await res.json()) as ArrivalsExportPayload
      if (
        (!payload.detail || payload.detail.length === 0) &&
        (!payload.vehicles || payload.vehicles.length === 0)
      ) {
        toast.info('No arrivals data to download for the selected date.')
        return
      }
      const built = buildArrivalsWorkbook(payload)
      if (format === 'xlsx') {
        triggerBlobDownload(built.xlsxBlob, `${built.filenameStem}.xlsx`)
      } else {
        const zipBlob = await built.csvZipBlob
        triggerBlobDownload(zipBlob, `${built.filenameStem}.zip`)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not download arrivals'
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
          aria-label="Download arrivals list"
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

export default DownloadArrivalsButton
