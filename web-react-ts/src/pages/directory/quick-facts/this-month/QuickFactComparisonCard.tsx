import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'components/lib/utils'
import { Card, CardContent } from 'components/ui/card'
import { Separator } from 'components/ui/separator'
import { Skeleton } from 'components/ui/skeleton'

export type ComparisonAccent = 'members' | 'defaulters' | 'banking'

const accentBg: Record<ComparisonAccent, string> = {
  members: 'bg-members/10',
  defaulters: 'bg-defaulters/10',
  banking: 'bg-banking/10',
}

const accentText: Record<ComparisonAccent, string> = {
  members: 'text-members',
  defaulters: 'text-defaulters',
  banking: 'text-banking',
}

type Props = {
  testId?: string
  icon: LucideIcon
  accent: ComparisonAccent
  metricLabel: string
  churchLabel: string
  churchValue: string
  benchmarkLabel: string
  benchmarkValue: string
  benchmarkContext: string
  delta: number | null
  loading?: boolean
}

const QuickFactComparisonCard = ({
  testId,
  icon: Icon,
  accent,
  metricLabel,
  churchLabel,
  churchValue,
  benchmarkLabel,
  benchmarkValue,
  benchmarkContext,
  delta,
  loading = false,
}: Props) => {
  const showDeltaPill = typeof delta === 'number' && Number.isFinite(delta)
  const direction: 'up' | 'down' | 'flat' = !showDeltaPill
    ? 'flat'
    : (delta as number) > 0
      ? 'up'
      : (delta as number) < 0
        ? 'down'
        : 'flat'

  const DeltaIcon =
    direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus
  const deltaPillClass =
    direction === 'up'
      ? 'bg-success/15 text-success'
      : direction === 'down'
        ? 'bg-destructive/15 text-destructive'
        : 'bg-muted text-muted-foreground'
  const aboveBelow =
    direction === 'up'
      ? 'above'
      : direction === 'down'
        ? 'below'
        : 'at'
  const benchmarkShort = benchmarkLabel.toLowerCase()
  const deltaText = showDeltaPill
    ? direction === 'flat'
      ? `At the ${benchmarkShort}`
      : `${Math.round(Math.abs(delta as number))}% ${aboveBelow} ${benchmarkShort}`
    : ''

  return (
    <Card
      className="h-full overflow-hidden"
      data-testid={testId}
      aria-label={metricLabel}
    >
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        {/* Metric identity */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              accentBg[accent]
            )}
          >
            <Icon className={cn('size-5', accentText[accent])} />
          </span>
          <p className="text-sm font-semibold text-foreground">{metricLabel}</p>
        </div>

        {/* Church value */}
        <div className="mt-5 space-y-1.5">
          {!loading && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {churchLabel}
            </p>
          )}
          {loading ? (
            <Skeleton className="h-12 w-32" />
          ) : (
            <p
              className={cn(
                'text-4xl font-semibold tracking-tight tabular-nums',
                accentText[accent]
              )}
            >
              {churchValue}
            </p>
          )}

          {showDeltaPill && !loading && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                deltaPillClass
              )}
            >
              <DeltaIcon className="size-3" />
              {deltaText}
            </span>
          )}
        </div>

        <Separator className="my-5" />

        {/* Benchmark */}
        <div className="mt-auto space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {benchmarkLabel}
          </p>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {benchmarkValue}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{benchmarkContext}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickFactComparisonCard
