import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import ShepherdingSlide from '../components/ShepherdingSlide'
import {
  AnchorWeekYear,
  MetricKey,
  SlideData,
  WindowWeeks,
} from '../shepherding-control-types'

type Api = {
  render: (slide: SlideData) => Promise<HTMLElement>
}

type Props = {
  metricA: MetricKey
  metricB: MetricKey | null
  anchor: AnchorWeekYear
  windowWeeks: WindowWeeks
}

// Renders one slide at a time into an off-screen, fixed-size container so
// html2canvas can snapshot it. We only ever keep one slide in memory at a
// time — the caller drives the loop and disposes between iterations.
const OffscreenSlideRenderer = forwardRef<Api, Props>(
  ({ metricA, metricB, anchor, windowWeeks }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [currentSlide, setCurrentSlide] = useState<SlideData | null>(null)
    const resolverRef = useRef<((el: HTMLElement) => void) | null>(null)

    useImperativeHandle(ref, () => ({
      render: (slide: SlideData) =>
        new Promise<HTMLElement>((resolve) => {
          resolverRef.current = (el) => resolve(el)
          setCurrentSlide(slide)
          // The effect inside the rendered slide will fire after layout; we
          // wait two frames to give Recharts enough time to paint.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (containerRef.current && resolverRef.current) {
                resolverRef.current(containerRef.current)
                resolverRef.current = null
              }
            })
          })
        }),
    }))

    return (
      <div
        // Off-screen but rendered — html2canvas walks the actual DOM.
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: '1920px',
          height: '1080px',
          pointerEvents: 'none',
          opacity: 1,
        }}
        aria-hidden
      >
        <div
          ref={containerRef}
          className="dark bg-background text-foreground"
          style={{ width: '1920px', height: '1080px' }}
        >
          {currentSlide && (
            <ShepherdingSlide
              slide={currentSlide}
              loading={false}
              metricA={metricA}
              metricB={metricB}
              anchor={anchor}
              windowWeeks={windowWeeks}
              onSelectChild={() => undefined}
            />
          )}
        </div>
      </div>
    )
  }
)

OffscreenSlideRenderer.displayName = 'OffscreenSlideRenderer'

export default OffscreenSlideRenderer
