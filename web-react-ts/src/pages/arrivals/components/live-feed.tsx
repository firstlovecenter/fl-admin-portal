import { ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Skeleton } from 'components/ui/skeleton'
import { cn } from 'components/lib/utils'

export type StatusTone =
  | 'defaulters'
  | 'warning'
  | 'arrivals'
  | 'destructive'
  | 'success'
  | 'members'
  | 'churches'
  | 'banking'

const toneClasses: Record<StatusTone, { bg: string; text: string }> = {
  defaulters: { bg: 'bg-defaulters/10', text: 'text-defaulters' },
  warning: { bg: 'bg-warning/10', text: 'text-warning' },
  arrivals: { bg: 'bg-arrivals/10', text: 'text-arrivals' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive' },
  success: { bg: 'bg-success/10', text: 'text-success' },
  members: { bg: 'bg-members/10', text: 'text-members' },
  churches: { bg: 'bg-churches/10', text: 'text-churches' },
  banking: { bg: 'bg-banking/10', text: 'text-banking' },
}

type StatusTileProps = {
  label: string
  value?: number | string
  icon: React.ComponentType<{ className?: string }>
  tone: StatusTone
  onClick?: () => void
  loading?: boolean
}

export const StatusTile = ({
  label,
  value,
  icon: Icon,
  tone,
  onClick,
  loading,
}: StatusTileProps) => {
  const t = toneClasses[tone]
  const interactive = !!onClick

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            t.bg
          )}
        >
          <Icon className={cn('size-4', t.text)} />
        </span>
        {interactive && (
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        {loading ? (
          <Skeleton className="h-6 w-10" />
        ) : (
          <p className="text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
            {value ?? '—'}
          </p>
        )}
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">
          {label}
        </p>
      </div>
    </>
  )

  const baseClasses =
    'group relative flex w-full flex-col rounded-xl border border-border bg-card p-3 text-left transition-colors min-h-11'

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          baseClasses,
          'hover:border-foreground/10 hover:shadow-sm active:scale-[0.99]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
      >
        {content}
      </button>
    )
  }

  return <div className={baseClasses}>{content}</div>
}

type LiveRowProps = {
  label: string
  value?: number | string
  icon: React.ComponentType<{ className?: string }>
  tone: StatusTone
  loading?: boolean
}

export const LiveRow = ({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: LiveRowProps) => {
  const t = toneClasses[tone]
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          t.bg
        )}
      >
        <Icon className={cn('size-5', t.text)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {value ?? '—'}
        </p>
      )}
    </div>
  )
}

export const LiveDot = () => (
  <span className="relative flex size-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
    <span className="relative inline-flex size-2 rounded-full bg-success" />
  </span>
)

const formatRelative = (ms: number) => {
  if (ms < 5_000) return 'just now'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

/**
 * Polls only while the tab/PWA is in the foreground. Apollo's built-in
 * `pollInterval` option polls regardless of visibility, which burns
 * bandwidth and battery in the background. Pair this with a `useQuery`
 * that does NOT set `pollInterval` — call this hook with the returned
 * `startPolling` / `stopPolling` and the interval. Refetches once on
 * tab return so the user sees fresh data the moment they look at it.
 */
export const useVisibilityAwarePolling = ({
  startPolling,
  stopPolling,
  refetch,
  interval,
}: {
  startPolling: (intervalMs: number) => void
  stopPolling: () => void
  refetch?: () => unknown
  interval: number
}) => {
  useEffect(() => {
    const apply = () => {
      if (document.visibilityState === 'visible') {
        if (refetch) refetch()
        startPolling(interval)
      } else {
        stopPolling()
      }
    }
    apply()
    document.addEventListener('visibilitychange', apply)
    return () => {
      document.removeEventListener('visibilitychange', apply)
      stopPolling()
    }
  }, [startPolling, stopPolling, refetch, interval])
}

export const useUpdatedAt = (data: unknown) => {
  const [updatedAt, setUpdatedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const lastDataRef = useRef(data)

  useEffect(() => {
    if (data && data !== lastDataRef.current) {
      lastDataRef.current = data
      setUpdatedAt(Date.now())
    }
  }, [data])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5_000)
    return () => window.clearInterval(id)
  }, [])

  return formatRelative(now - updatedAt)
}

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    {children}
  </h2>
)
