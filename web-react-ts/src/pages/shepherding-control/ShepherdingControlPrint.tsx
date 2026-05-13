import { useApolloClient } from '@apollo/client'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ShepherdingSlide from './components/ShepherdingSlide'
import { checkScope, walkSubtree } from './shepherding-control-fetch'
import {
  AnchorWeekYear,
  DepthChoice,
  MetricKey,
  ShepherdingLevel,
  SlideData,
  SlideNode,
  WindowWeeks,
} from './shepherding-control-types'
import { SHEPHERDING_LEVELS } from './shepherding-control-utils'

const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 0; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; }
  }
`

const ShepherdingControlPrint = () => {
  const [params] = useSearchParams()
  const client = useApolloClient()

  const level = params.get('level') as ShepherdingLevel
  const id = params.get('id') ?? ''
  const depth = (params.get('depth') ?? 'full-subtree') as DepthChoice
  const metricA = (params.get('metricA') ?? 'serviceAttendance') as MetricKey
  const metricBRaw = params.get('metricB')
  const metricB: MetricKey | null =
    metricBRaw && metricBRaw !== 'none' ? (metricBRaw as MetricKey) : null
  const windowWeeks = Number(params.get('window') ?? 4) as WindowWeeks
  const week = Number(params.get('week'))
  const year = Number(params.get('year'))

  const anchor: AnchorWeekYear = { week, year }

  const [slides, setSlides] = useState<SlideData[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    document.title = 'Shepherding Control — Print'
  }, [])

  useEffect(() => {
    if (
      !level ||
      !id ||
      !SHEPHERDING_LEVELS.includes(level) ||
      !week ||
      !year ||
      Number.isNaN(week) ||
      Number.isNaN(year)
    ) {
      setStatus('error')
      setErrorMessage('Missing or invalid parameters in URL.')
      return
    }

    cancelledRef.current = false
    const root: SlideNode = { type: level, id, name: '' }

    const run = async () => {
      try {
        const allowed = await checkScope(client, root)
        if (!allowed) {
          setStatus('error')
          setErrorMessage('Out of scope: you can only print your own subtree.')
          return
        }

        const collected: SlideData[] = []
        for await (const slide of walkSubtree(
          client,
          root,
          depth,
          () => cancelledRef.current
        )) {
          if (cancelledRef.current) return
          collected.push(slide)
          setSlides([...collected])
        }

        if (!cancelledRef.current) {
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setStatus('error')
          setErrorMessage(
            err instanceof Error ? err.message : 'Failed to load slides.'
          )
        }
      }
    }

    run()
    return () => {
      cancelledRef.current = true
    }
  }, [client, level, id, depth, week, year])

  // Defer by one frame so the final slide is painted before the dialog opens.
  useEffect(() => {
    if (status !== 'ready') return
    const id = requestAnimationFrame(() => window.print())
    return () => cancelAnimationFrame(id)
  }, [status])

  if (status === 'error') {
    return (
      <div className="dark flex min-h-svh items-center justify-center bg-background text-foreground">
        <p className="max-w-md text-center text-xl text-destructive">
          {errorMessage}
        </p>
      </div>
    )
  }

  return (
    // eslint-disable-next-line react/no-danger
    <div className="dark bg-background text-foreground">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {status === 'loading' && slides.length === 0 && (
        <div className="flex min-h-svh items-center justify-center print:hidden">
          <p className="text-xl text-muted-foreground">Loading slides…</p>
        </div>
      )}

      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="relative h-screen w-full"
          style={i < slides.length - 1 ? { breakAfter: 'page' } : undefined}
        >
          <ShepherdingSlide
            slide={slide}
            loading={false}
            metricA={metricA}
            metricB={metricB}
            anchor={anchor}
            windowWeeks={windowWeeks}
            onSelectChild={() => undefined}
          />
        </div>
      ))}
    </div>
  )
}

export default ShepherdingControlPrint
