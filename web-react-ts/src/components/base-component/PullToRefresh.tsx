import { ReactNode, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from 'components/lib/utils'

const PULL_THRESHOLD = 80
const MAX_PULL = 120
const RESISTANCE = 0.5

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown>
  children: ReactNode
  className?: string
  disabled?: boolean
}

const findScrollableAncestor = (
  start: HTMLElement | null
): HTMLElement | null => {
  let node = start?.parentElement ?? null
  while (node) {
    const overflowY = window.getComputedStyle(node).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return null
}

const PullToRefresh = ({
  onRefresh,
  children,
  className,
  disabled = false,
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)
  const touchId = useRef<number | null>(null)
  const dragging = useRef(false)
  const pullDistanceRef = useRef(0)
  const mounted = useRef(true)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  pullDistanceRef.current = pullDistance

  useEffect(
    () => () => {
      mounted.current = false
    },
    []
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined

    const isAtTop = () => {
      const scroller = findScrollableAncestor(el)
      if (scroller) return scroller.scrollTop <= 0
      return window.scrollY <= 0
    }

    const findActiveTouch = (touches: TouchList) => {
      if (touchId.current === null) return null
      for (let i = 0; i < touches.length; i += 1) {
        if (touches[i].identifier === touchId.current) return touches[i]
      }
      return null
    }

    const resetGesture = () => {
      startY.current = null
      touchId.current = null
      dragging.current = false
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (disabled || refreshing) return
      if (!isAtTop()) return
      const touch = e.touches[0]
      startY.current = touch.clientY
      touchId.current = touch.identifier
      dragging.current = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === null || refreshing || disabled) return
      const touch = findActiveTouch(e.touches)
      if (!touch) return
      const delta = touch.clientY - startY.current
      if (delta <= 0 || !isAtTop()) {
        if (dragging.current) {
          dragging.current = false
          setPullDistance(0)
        }
        return
      }
      if (e.cancelable) e.preventDefault()
      dragging.current = true
      setPullDistance(Math.min(delta * RESISTANCE, MAX_PULL))
    }

    const handleTouchEnd = async (e: TouchEvent) => {
      if (refreshing || startY.current === null) {
        resetGesture()
        return
      }
      const stillThere = findActiveTouch(e.changedTouches)
      if (!stillThere) return
      const finalDistance = pullDistanceRef.current
      resetGesture()
      if (finalDistance < PULL_THRESHOLD) {
        setPullDistance(0)
        return
      }
      setRefreshing(true)
      setPullDistance(PULL_THRESHOLD)
      try {
        await onRefreshRef.current()
      } finally {
        if (mounted.current) {
          setRefreshing(false)
          setPullDistance(0)
        }
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    el.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [disabled, refreshing])

  const indicatorVisible = pullDistance > 0 || refreshing
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1)
  const animatingHeight = !dragging.current

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
    >
      <div
        aria-hidden={!indicatorVisible}
        className={cn(
          'pointer-events-none flex items-center justify-center overflow-hidden text-muted-foreground',
          animatingHeight && 'transition-[height] duration-150'
        )}
        style={{ height: indicatorVisible ? pullDistance : 0 }}
      >
        <Loader2
          className={cn('size-5', refreshing && 'animate-spin')}
          style={{
            opacity: refreshing ? 1 : progress,
            transform: refreshing ? 'none' : `rotate(${progress * 360}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  )
}

export default PullToRefresh
