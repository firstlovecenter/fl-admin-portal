import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from 'components/ui/button'
import useSelectedWeek from 'hooks/useSelectedWeek'
import DownloadFormatDialog, {
  type DownloadFormatOption,
} from 'pages/reports/_shared/DownloadFormatDialog'
import { triggerBlobDownload } from 'pages/reports/_shared/triggerBlobDownload'

import {
  buildDefaultersWorkbook,
  DefaultersDownloadLevel,
} from './utils/buildDefaultersWorkbook'
import { fetchDefaultersExport } from './utils/useDefaultersExport'

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

    setPending(format)
    try {
      const payload = await fetchDefaultersExport(
        level,
        churchId,
        weekStart,
        isCurrent
      )
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
