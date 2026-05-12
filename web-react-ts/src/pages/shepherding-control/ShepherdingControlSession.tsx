import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  MonitorPlay,
  MonitorUp,
} from 'lucide-react'
import { MemberContext } from 'contexts/MemberContext'
import { isAuthorised } from 'global-utils'
import { permitLeaderAdmin } from 'permission-utils'
import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
import { useShepherdingSlide } from './useShepherdingSlide'
import {
  ChildSummary,
  MetricKey,
  ShepherdingLevel,
  SlideNode,
  WindowWeeks,
  AnchorWeekYear,
} from './shepherding-control-types'
import {
  currentAnchorWeekYear,
  nextLevelFor,
  resolveStartingScope,
  shiftAnchor,
  SHEPHERDING_LEVELS,
} from './shepherding-control-utils'
import ShepherdingBackButton from './components/ShepherdingBackButton'
import MetricPicker from './components/MetricPicker'
import WindowSizeToggle from './components/WindowSizeToggle'
import ShepherdingSlide from './components/ShepherdingSlide'
import PdfExportDialog from './pdf/PdfExportDialog'
import {
  ProjectorState,
  useProjectorController,
} from './shepherding-control-channel'

const DEFAULT_METRIC_A: MetricKey = 'serviceAttendance'
const DEFAULT_METRIC_B: MetricKey = 'income'

const ShepherdingControlSession = () => {
  const { currentUser } = useContext(MemberContext)

  const startingScope = useMemo<SlideNode | null>(() => {
    if (!currentUser) return null
    const userRoles = currentUser.roles ?? []
    return resolveStartingScope(currentUser, (level: ShepherdingLevel) =>
      isAuthorised(permitLeaderAdmin(level), userRoles)
    )
  }, [currentUser])

  const [stack, setStack] = useState<SlideNode[]>(() =>
    startingScope ? [startingScope] : []
  )
  const [windowWeeks, setWindowWeeks] = useState<WindowWeeks>(4)
  const [anchor, setAnchor] = useState<AnchorWeekYear>(currentAnchorWeekYear())
  const [metricA, setMetricA] = useState<MetricKey>(DEFAULT_METRIC_A)
  const [metricB, setMetricB] = useState<MetricKey | null>(DEFAULT_METRIC_B)
  const [siblings, setSiblings] = useState<SlideNode[]>([])
  const [pdfOpen, setPdfOpen] = useState(false)

  // Re-seed the stack once the starting scope resolves (currentUser arrives
  // async via SetPermissions).
  useEffect(() => {
    if (startingScope && stack.length === 0) {
      setStack([startingScope])
    }
  }, [startingScope, stack.length])

  const current = stack[stack.length - 1] ?? null
  const parent = stack.length > 1 ? stack[stack.length - 2] : null

  // Parent slide is used to compute sibling traversal — siblings are the
  // parent's children. The presenter's own starting node has no siblings
  // (they are the root).
  const parentSlide = useShepherdingSlide(parent?.type ?? null, parent?.id ?? null)
  const currentSlide = useShepherdingSlide(
    current?.type ?? null,
    current?.id ?? null
  )

  useEffect(() => {
    if (!current) return
    if (parent && parentSlide.slide) {
      const sibs = parentSlide.slide.children.map((c) => ({
        type: current.type,
        id: c.id,
        name: c.name,
      }))
      setSiblings(sibs)
    } else {
      setSiblings([current])
    }
  }, [parent, parentSlide.slide, current])

  // Keep `current.name` in sync once the slide data loads (we start with an
  // empty name on the resolved root). Read `stack` inside the setter so we
  // never overwrite a newer node selected before the previous slide query
  // resolved.
  useEffect(() => {
    const loadedSlide = currentSlide.slide
    if (!loadedSlide) return
    setStack((prev) => {
      if (!prev.length) return prev
      const top = prev[prev.length - 1]
      if (top.id !== loadedSlide.id || top.name === loadedSlide.name) {
        return prev
      }
      const next = [...prev]
      next[next.length - 1] = { ...top, name: loadedSlide.name }
      return next
    })
  }, [currentSlide.slide])

  const siblingIndex = useMemo(() => {
    if (!current) return -1
    return siblings.findIndex((s) => s.id === current.id)
  }, [siblings, current])

  const goSibling = useCallback(
    (delta: number) => {
      if (!siblings.length || siblingIndex < 0) return
      const nextIndex =
        (siblingIndex + delta + siblings.length) % siblings.length
      const nextNode = siblings[nextIndex]
      setStack((prev) => {
        if (!prev.length) return prev
        const next = [...prev]
        next[next.length - 1] = nextNode
        return next
      })
    },
    [siblings, siblingIndex]
  )

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const drillInto = useCallback(
    (child: ChildSummary) => {
      if (!current) return
      const nextLevel = nextLevelFor(current.type)
      if (!nextLevel) return
      setStack((prev) => [
        ...prev,
        { type: nextLevel, id: child.id, name: child.name },
      ])
    },
    [current]
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (pdfOpen) return
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goSibling(1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goSibling(-1)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        goBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goSibling, goBack, pdfOpen])

  const handleOlder = () => setAnchor((a) => shiftAnchor(a, -windowWeeks))
  const handleNewer = () => setAnchor((a) => shiftAnchor(a, windowWeeks))

  const projectorState = useMemo<ProjectorState | null>(() => {
    if (!current) return null
    return {
      level: current.type,
      id: current.id,
      name: current.name,
      anchor,
      windowWeeks,
      metricA,
      metricB,
    }
  }, [current, anchor, windowWeeks, metricA, metricB])

  const projector = useProjectorController(projectorState)

  if (!startingScope) {
    return (
      <div className="dark flex min-h-svh flex-col items-center justify-center bg-background p-8 text-center text-foreground">
        <h2 className="text-3xl font-semibold">No leader scope detected</h2>
        <p className="mt-2 max-w-md text-xl text-muted-foreground">
          You need to be a leader or admin from Governorship up to use
          Shepherding Control.
        </p>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="dark min-h-svh bg-background p-8">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  const weekLabel = `Week ${anchor.week} · ${anchor.year}`
  const levelIndex = SHEPHERDING_LEVELS.indexOf(current.type)

  return (
    <div className="dark relative flex min-h-svh w-full flex-col bg-background text-2xl text-foreground">
      {/* Edge-tap regions for touch — left/right thirds advance siblings */}
      <button
        type="button"
        aria-label="Previous sibling"
        onClick={() => goSibling(-1)}
        className="pointer-events-auto absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize bg-transparent opacity-0 focus:opacity-0"
      />
      <button
        type="button"
        aria-label="Next sibling"
        onClick={() => goSibling(1)}
        className="pointer-events-auto absolute inset-y-0 right-0 z-10 w-1/3 cursor-e-resize bg-transparent opacity-0 focus:opacity-0"
      />

      <div className="relative z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-background/60 p-6 backdrop-blur">
        <ShepherdingBackButton onBack={goBack} disabled={stack.length <= 1} />

        <div className="flex flex-1 items-center justify-center gap-3 text-2xl text-muted-foreground">
          {stack.map((node, idx) => (
            <span key={`${node.type}-${node.id}`} className="flex items-center gap-3">
              {idx > 0 && <ChevronRight className="size-5" />}
              <span
                className={
                  idx === stack.length - 1
                    ? 'font-semibold text-foreground'
                    : ''
                }
              >
                {node.name || node.type}
              </span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {projector.isSupported && (
            <Button
              type="button"
              variant={projector.isConnected ? 'default' : 'secondary'}
              size="lg"
              onClick={projector.focusProjector}
              className="min-h-12 gap-2 text-lg"
              title={
                projector.isConnected
                  ? 'Projector window open — click to focus'
                  : 'Open a second window for projection'
              }
            >
              {projector.isConnected ? (
                <MonitorPlay className="size-5" />
              ) : (
                <MonitorUp className="size-5" />
              )}
              {projector.isConnected ? 'Projector' : 'Cast'}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setPdfOpen(true)}
            className="min-h-12 gap-2 text-lg"
          >
            <FileDown className="size-5" />
            PDF
          </Button>
        </div>
      </div>

      <main className="relative z-20 mx-auto flex w-full max-w-[1920px] flex-1 flex-col">
        <ShepherdingSlide
          slide={currentSlide.slide}
          loading={currentSlide.loading}
          metricA={metricA}
          metricB={metricB}
          anchor={anchor}
          windowWeeks={windowWeeks}
          onSelectChild={drillInto}
        />
      </main>

      <footer className="relative z-20 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 bg-background/60 p-6 backdrop-blur">
        <div className="flex flex-wrap items-end gap-4">
          <WindowSizeToggle value={windowWeeks} onChange={setWindowWeeks} />
          <MetricPicker
            label="Metric A"
            value={metricA}
            onChange={(next) => next && setMetricA(next)}
          />
          <MetricPicker
            label="Metric B"
            value={metricB}
            onChange={setMetricB}
            allowNone
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleOlder}
            className="min-h-12 gap-2 text-lg"
          >
            <ChevronLeft className="size-5" />
            Older
          </Button>
          <span className="min-w-44 text-center text-xl tabular-nums text-muted-foreground">
            {weekLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleNewer}
            className="min-h-12 gap-2 text-lg"
          >
            Newer
            <ChevronRight className="size-5" />
          </Button>
        </div>

        {siblings.length > 1 && siblingIndex >= 0 && (
          <div className="basis-full text-center text-base uppercase tracking-wider text-muted-foreground">
            Sibling {siblingIndex + 1} of {siblings.length} · Level {levelIndex + 1}/
            {SHEPHERDING_LEVELS.length}
          </div>
        )}
      </footer>

      <PdfExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        root={current}
        anchor={anchor}
        windowWeeks={windowWeeks}
        metricA={metricA}
        metricB={metricB}
      />
    </div>
  )
}

export default ShepherdingControlSession
