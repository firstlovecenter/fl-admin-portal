import { useApolloClient } from '@apollo/client'
import { useCallback, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Button } from 'components/ui/button'
import { Progress } from 'components/ui/progress'
import {
  RadioGroup,
  RadioGroupItem,
} from 'components/ui/radio-group'
import { Label } from 'components/ui/label'
import {
  AnchorWeekYear,
  MetricKey,
  SlideData,
  SlideNode,
  WindowWeeks,
} from '../shepherding-control-types'
import {
  METRIC_LABEL,
  pdfFileName,
} from '../shepherding-control-utils'
import {
  DepthChoice,
  renderDeckToPdf,
} from './pdf-export'
import OffscreenSlideRenderer from './OffscreenSlideRenderer'

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
  const client = useApolloClient()
  const [depth, setDepth] = useState<DepthChoice>('full-subtree')
  const [rendered, setRendered] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const cancelRef = useRef(false)
  const rendererRef = useRef<{
    render: (slide: SlideData) => Promise<HTMLElement>
  } | null>(null)

  const handleClose = (next: boolean) => {
    if (isExporting && !next) {
      // Flag cancellation; the loop in renderDeckToPdf checks this every
      // iteration and bails. We do NOT flip isExporting here — the `finally`
      // block in handleGenerate is the single source of truth for that.
      cancelRef.current = true
      return
    }
    if (!next) {
      setRendered(null)
      setError(null)
    }
    onOpenChange(next)
  }

  const handleGenerate = useCallback(async () => {
    if (!root) return
    cancelRef.current = false
    setError(null)
    setRendered(0)
    setIsExporting(true)
    try {
      await renderDeckToPdf({
        client,
        root,
        depth,
        contextHeader: `Shepherding Control — ${root.name || root.type} — Week ${anchor.week} of ${anchor.year}`,
        fileName: pdfFileName(root.name || root.type, anchor),
        onProgress: (done) => setRendered(done),
        isCancelled: () => cancelRef.current,
        renderSlide: async (slide: SlideData) => {
          if (!rendererRef.current) {
            throw new Error('Renderer not mounted')
          }
          return rendererRef.current.render(slide)
        },
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'PDF export failed'
      setError(message)
    } finally {
      setIsExporting(false)
    }
  }, [root, client, depth, anchor])

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Download Shepherding Control deck</DialogTitle>
            <DialogDescription>
              Exports the deck for{' '}
              <span className="font-semibold text-foreground">
                {root?.name || root?.type}
              </span>{' '}
              with the current week ({anchor.week}/{anchor.year}), {windowWeeks}
              -week window, and metric{metricB ? 's' : ''}{' '}
              <span className="font-semibold text-foreground">
                {METRIC_LABEL[metricA]}
              </span>
              {metricB ? ` + ${METRIC_LABEL[metricB]}` : ''}.
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

          {rendered !== null && (
            <div className="space-y-2">
              <Progress
                value={isExporting ? undefined : 100}
                className={isExporting ? 'animate-pulse' : undefined}
              />
              <p className="text-center text-sm text-muted-foreground tabular-nums">
                {rendered} slide{rendered === 1 ? '' : 's'} rendered
                {isExporting ? '…' : ''}
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {isExporting ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleClose(false)}
                className="min-h-11 gap-2"
              >
                <X className="size-4" />
                Cancel
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleClose(false)}
                  className="min-h-11"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!root}
                  className="min-h-11 gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Generate PDF
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OffscreenSlideRenderer
        ref={(api) => {
          rendererRef.current = api
        }}
        metricA={metricA}
        metricB={metricB}
        anchor={anchor}
        windowWeeks={windowWeeks}
      />
    </>
  )
}

export default PdfExportDialog
