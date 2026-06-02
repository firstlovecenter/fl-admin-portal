import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Button } from 'components/ui/button'
import {
  RadioGroup,
  RadioGroupItem,
} from 'components/ui/radio-group'
import { Label } from 'components/ui/label'
import {
  AnchorWeekYear,
  DepthChoice,
  MetricKey,
  SlideNode,
  WindowWeeks,
} from '../shepherding-control-types'
import { METRIC_LABEL } from '../shepherding-control-utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  root: SlideNode | null
  anchor: AnchorWeekYear
  windowWeeks: WindowWeeks
  metricA: MetricKey
  metricB: MetricKey | null
}

const DEPTH_OPTIONS: { value: DepthChoice; label: string; hint: string }[] = [
  {
    value: 'this-level',
    label: 'This level only',
    hint: 'Just the current church — one page.',
  },
  {
    value: 'one-level-deeper',
    label: 'One level deeper',
    hint: 'Current church + every direct child.',
  },
  {
    value: 'full-subtree',
    label: 'Full subtree',
    hint: 'Every church beneath this one. May be hundreds of pages.',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Print Shepherding Control deck</DialogTitle>
          <DialogDescription>
            Opens a print-ready view for{' '}
            <span className="font-semibold text-foreground">
              {root?.name || root?.type}
            </span>{' '}
            with the current week ({anchor.week}/{anchor.year}),{' '}
            {windowWeeks}-week window, and metric{metricB ? 's' : ''}{' '}
            <span className="font-semibold text-foreground">
              {METRIC_LABEL[metricA]}
            </span>
            {metricB ? ` + ${METRIC_LABEL[metricB]}` : ''}. Use your
            browser&apos;s print dialog to save as PDF.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={depth}
          onValueChange={(value) => setDepth(value as DepthChoice)}
          className="space-y-2"
        >
          {DEPTH_OPTIONS.map((opt) => (
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
                  {opt.label}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {opt.hint}
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
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleOpen}
            disabled={!root}
            className="min-h-11 gap-2"
          >
            <ExternalLink className="size-4" />
            Open Print View
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PdfExportDialog
