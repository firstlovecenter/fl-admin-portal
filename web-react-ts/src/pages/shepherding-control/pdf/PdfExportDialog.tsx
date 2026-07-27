import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Button } from 'components/ui/button'
import { RadioGroup, RadioGroupItem } from 'components/ui/radio-group'
import { Label } from 'components/ui/label'
import {
  AnchorWeekYear,
  DepthChoice,
  MetricKey,
  SlideNode,
  WindowWeeks,
} from '../shepherding-control-types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  root: SlideNode | null
  anchor: AnchorWeekYear
  windowWeeks: WindowWeeks
  metricA: MetricKey
  metricB: MetricKey | null
}

const DEPTH_OPTION_KEYS: {
  value: DepthChoice
  labelKey: string
  hintKey: string
}[] = [
  {
    value: 'this-level',
    labelKey: 'shepherding.pdfDialog.depthThisLevel',
    hintKey: 'shepherding.pdfDialog.depthThisLevelHint',
  },
  {
    value: 'one-level-deeper',
    labelKey: 'shepherding.pdfDialog.depthOneDeeper',
    hintKey: 'shepherding.pdfDialog.depthOneDeeperHint',
  },
  {
    value: 'full-subtree',
    labelKey: 'shepherding.pdfDialog.depthFullSubtree',
    hintKey: 'shepherding.pdfDialog.depthFullSubtreeHint',
  },
]

const PdfExportDialog = ({
  open,
  onOpenChange,
  root,
  anchor,
  windowWeeks,
  metricA,
  metricB,
}: Props) => {
  const { t } = useTranslation()
  const [depth, setDepth] = useState<DepthChoice>('full-subtree')

  const handleOpen = () => {
    if (!root) return
    const p = new URLSearchParams({
      level: root.type,
      id: root.id,
      depth,
      metricA,
      metricB: metricB ?? 'none',
      window: String(windowWeeks),
      week: String(anchor.week),
      year: String(anchor.year),
    })
    window.open(
      `/shepherding-control/print?${p.toString()}`,
      '_blank',
      'noopener,noreferrer'
    )
    onOpenChange(false)
  }

  const descriptionKey = metricB
    ? 'shepherding.pdfDialog.descriptionTwo'
    : 'shepherding.pdfDialog.descriptionOne'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('shepherding.pdfDialog.title')}</DialogTitle>
          <DialogDescription>
            {t(descriptionKey, {
              name:
                root?.name ||
                (root ? t(`shared.churchLevel.${root.type}`) : ''),
              week: anchor.week,
              year: anchor.year,
              window: windowWeeks,
              metricA: t(`shepherding.metrics.${metricA}`),
              metricB: metricB ? t(`shepherding.metrics.${metricB}`) : '',
            })}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={depth}
          onValueChange={(value) => setDepth(value as DepthChoice)}
          className="space-y-2"
        >
          {DEPTH_OPTION_KEYS.map((opt) => (
            <Label
              key={opt.value}
              htmlFor={`depth-${opt.value}`}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-accent"
            >
              <RadioGroupItem
                id={`depth-${opt.value}`}
                value={opt.value}
                className="mt-1"
              />
              <span className="flex-1">
                <span className="block font-medium text-foreground">
                  {t(opt.labelKey)}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {t(opt.hintKey)}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="min-h-11"
          >
            {t('shepherding.pdfDialog.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleOpen}
            disabled={!root}
            className="min-h-11 gap-2"
          >
            <ExternalLink className="size-4" />
            {t('shepherding.pdfDialog.openPrintView')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PdfExportDialog
