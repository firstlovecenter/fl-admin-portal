import { useEffect } from 'react'
import ShepherdingSlide from './components/ShepherdingSlide'
import { useShepherdingSlide } from './useShepherdingSlide'
import { useProjectorViewer } from './shepherding-control-channel'

// Projection-only window. No header, no controls — just the full-screen
// slide that follows whatever the controller broadcasts. Mounts inside
// the normal Apollo + auth tree (same origin popup inherits sessionStorage
// and the user has the gating role by virtue of being on the parent route).
const ShepherdingControlProjector = () => {
  const state = useProjectorViewer()
  const slideData = useShepherdingSlide(
    state?.level ?? null,
    state?.id ?? null
  )

  useEffect(() => {
    document.title = state?.name
      ? `Projector — ${state.name}`
      : 'Shepherding Control — Projector'
  }, [state?.name])

  return (
    <div className="dark grid min-h-svh w-full bg-background text-foreground">
      {state ? (
        <ShepherdingSlide
          slide={slideData.slide}
          loading={slideData.loading}
          metricA={state.metricA}
          metricB={state.metricB}
          anchor={state.anchor}
          windowWeeks={state.windowWeeks}
          onSelectChild={() => undefined}
        />
      ) : (
        <div className="grid place-items-center p-12 text-center">
          <div>
            <h1 className="text-5xl font-bold">Waiting for controller…</h1>
            <p className="mt-4 text-2xl text-muted-foreground">
              Drag this window to your projector or external monitor. The
              slide will appear here as soon as the controller pushes the
              first selection.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShepherdingControlProjector
