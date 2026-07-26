import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const { weekStart, isCurrent, weekShortLabel } = useSelectedWeek()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<Format | null>(null)

  const formats: ReadonlyArray<DownloadFormatOption<Format>> = [
    {
      id: 'xlsx',
      label: t('services.defaulters.formatXlsx'),
      description: t('services.defaulters.formatXlsxDesc'),
      icon: FileSpreadsheet,
    },
    {
      id: 'csv-zip',
      label: t('services.defaulters.formatCsvZip'),
      description: t('services.defaulters.formatCsvZipDesc'),
      icon: FileText,
    },
  ]

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
        toast.info(t('services.defaulters.noDataToDownload'))
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
        err instanceof Error
          ? err.message
          : t('services.defaulters.downloadError')
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
        aria-label={t('services.defaulters.downloadAria')}
        aria-busy={pending !== null}
        className={className}
        onClick={() => setOpen(true)}
      >
        {pending !== null ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span className="sr-only">
              {t('services.defaulters.downloading')}
            </span>
          </>
        ) : (
          <Download aria-hidden="true" />
        )}
        <span className={showLabel ? '' : 'hidden lg:inline'}>
          {t('services.defaulters.download')}
        </span>
      </Button>
      <DownloadFormatDialog
        open={open}
        onOpenChange={setOpen}
        title={t('services.defaulters.downloadTitle')}
        description={t('services.defaulters.downloadDescription')}
        formats={formats}
        pending={pending}
        onSelect={handleSelect}
        accent="defaulters"
      />
    </>
  )
}

export default DownloadDefaultersButton
