import React, { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { cn } from 'components/lib/utils'

export interface AceternityTimelineEntry {
  key?: string
  title: string
  dateTime?: string
  content: React.ReactNode
}

interface AceternityTimelineProps {
  data: AceternityTimelineEntry[]
  className?: string
}

const DOT_COLUMN_PX = 36

export const AceternityTimeline = ({
  data,
  className,
}: AceternityTimelineProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!ref.current) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height)
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 85%', 'end 55%'],
  })

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height])
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  return (
    <div
      className={cn('relative w-full', className)}
      ref={containerRef}
      style={{ ['--timeline-dot-col' as string]: `${DOT_COLUMN_PX}px` }}
    >
      <div ref={ref} className="relative mx-auto pb-4">
        {data.map((item, index) => (
          <div
            key={item.key ?? index}
            className="relative flex justify-start gap-4 pt-6 first:pt-2"
          >
            <div className="sticky top-24 z-30 flex shrink-0 self-start">
              <div className="relative flex size-9 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                <div className="size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
              </div>
            </div>

            <div className="min-w-0 flex-1 pb-4">
              <time
                dateTime={item.dateTime}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {item.title}
              </time>
              <div className="mt-1.5">{item.content}</div>
            </div>
          </div>
        ))}

        <div
          style={{
            height: `${height}px`,
            left: `calc(var(--timeline-dot-col) / 2 - 1px)`,
          }}
          className="absolute top-0 w-[2px] overflow-hidden bg-gradient-to-b from-transparent via-border to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_8%,black_92%,transparent_100%)]"
        >
          {reduceMotion ? (
            <div className="absolute inset-x-0 top-0 h-full w-[2px] rounded-full bg-primary/40" />
          ) : (
            <motion.div
              style={{
                height: heightTransform,
                opacity: opacityTransform,
              }}
              className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-primary via-primary/60 to-transparent"
            />
          )}
        </div>
      </div>
    </div>
  )
}
