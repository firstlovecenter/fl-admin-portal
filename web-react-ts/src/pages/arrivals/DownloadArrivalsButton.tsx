import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from 'components/ui/button'
import useSelectedArrivalDate from 'hooks/useSelectedArrivalDate'
import DownloadFormatDialog, {
  type DownloadFormatOption,
} from 'pages/reports/_shared/DownloadFormatDialog'
import { triggerBlobDownload } from 'pages/reports/_shared/triggerBlobDownload'

import {
  ArrivalsDownloadLevel,
  ArrivalsExportPayload,
  buildArrivalsWorkbook,
} from './utils/buildArrivalsWorkbook'
import { fetchArrivalsExport } from './utils/useArrivalsExport'

type Format = 'xlsx' | 'csv-zip'

const FORMATS: ReadonlyArray<DownloadFormatOption<Format>> = [
  {
    id: 'xlsx',
    label: 'Excel (.xlsx)',
    description:
      'Multi-sheet workbook — sub-church summary, Bacenta detail, and vehicle detail.',
    icon: FileSpreadsheet,
  },
  {
    id: 'csv-zip',
    label: 'CSV (.zip)',
    description: 'One CSV per sheet, bundled into a single zip file.',
    icon: FileText,
  },
]

type DownloadArrivalsButtonProps = {
  level: ArrivalsDownloadLevel
  churchId: string | undefined
  /**
   * Pre-fetched payload. When provided the button skips the network call
   * and builds the workbook from it directly — used on the report page
   * where the same payload feeds the on-screen preview.
   */
  payload?: ArrivalsExportPayload
  disabled?: boolean
  className?: string
  /**
   * When true the "Download" label is always visible. Default (false)
   * matches the in-line dashboard usage where space is tight and only
   * the icon shows below `lg`.
   */
  showLabel?: boolean
}

const DownloadArrivalsButton = ({
  level,
  churchId,
  payload,
  disabled,
  className,
  showLabel = false,
}: DownloadArrivalsButtonProps) => {
  const { arrivalDate } = useSelectedArrivalDate()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<Format | null>(null)

  const handleSelect = async (format: Format) => {
    if (!churchId) return

    setPending(format)
    try {
      const data =
        payload ?? (await fetchArrivalsExport(level, churchId, arrivalDate))
      if (
        (!data.detail || data.detail.length === 0) &&
        (!data.vehicles || data.vehicles.length === 0)
      ) {
        toast.info('No arrivals data to download for the selected date.')
        setOpen(false)
        return
      }
      const built = buildArrivalsWorkbook(data)
      if (format === 'xlsx') {
        triggerBlobDownload(built.xlsxBlob, `${built.filenameStem}.xlsx`)
      } else {
        const zipBlob = await built.csvZipBlob
        triggerBlobDownload(zipBlob, `${built.filenameStem}.zip`)
      }
      setOpen(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not download arrivals'
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
        aria-label="Download arrivals list"
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
        title="Download arrivals"
        description="Choose a file format. The full snapshot includes every Bacenta and vehicle for the selected Sunday."
        formats={FORMATS}
        pending={pending}
        onSelect={handleSelect}
        accent="arrivals"
      />
    </>
  )
}

export default DownloadArrivalsButton
