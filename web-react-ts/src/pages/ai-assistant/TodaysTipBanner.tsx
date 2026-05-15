import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { ChevronDown, Sparkles } from 'lucide-react'
import { cn } from 'components/lib/utils'
import { Skeleton } from 'components/ui/skeleton'
import {
  WEEKLY_TIP_FOR_CHURCH,
  type WeeklyTipForChurchResult,
} from 'pages/dashboards/userWeeklyTipQueries'

type Props = {
  churchId: string | null | undefined
}

/**
 * Slim collapsible "Today's tip" banner that sits above the chat thread.
 * Defaults to collapsed (one-line summary). Tapping expands the full body
 * + scripture + book recommendation in a compact rendering — without the
 * full WeeklyTipCard's separate framed sections.
 */
const TodaysTipBanner = ({ churchId }: Props) => {
  const [open, setOpen] = useState(false)
  const { data, loading } = useQuery<WeeklyTipForChurchResult>(
    WEEKLY_TIP_FOR_CHURCH,
    {
      variables: { churchId: churchId ?? '' },
      skip: !churchId,
      fetchPolicy: 'cache-first',
    }
  )

  if (!churchId) return null
  if (loading) {
    return (
      <div className="border-b border-border bg-card px-4 py-3">
        <Skeleton className="h-4 w-48" />
      </div>
    )
  }

  const tip = data?.weeklyTipForChurch
  if (!tip) return null

  const summary = tip.body.split(/\.\s/)[0]
  const truncated = summary.length > 90 ? `${summary.slice(0, 90)}…` : `${summary}.`

  return (
    <div className="border-b border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'hsl(var(--arrivals) / 0.12)' }}
        >
          <Sparkles
            className="size-4"
            style={{ color: 'hsl(var(--arrivals))' }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Today&rsquo;s tip
          </p>
          <p className="truncate text-sm text-foreground">{truncated}</p>
        </div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/60 bg-muted/30 px-4 py-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {tip.body}
          </p>
          {tip.scripture && (
            <p className="text-xs italic text-muted-foreground">
              &ldquo;{tip.scripture.text}&rdquo; — {tip.scripture.book}{' '}
              {tip.scripture.chapter}:{tip.scripture.verse} (
              {tip.scripture.translation})
            </p>
          )}
          {tip.recommendedBook && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Read next:</span>{' '}
              {tip.recommendedBook.title} —{' '}
              <span className="italic">{tip.recommendedBook.author}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default TodaysTipBanner
