import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from 'components/lib/utils'
import { Card, CardContent } from './card'
import { Skeleton } from './skeleton'

type Accent =
  | 'brand'
  | 'members'
  | 'churches'
  | 'arrivals'
  | 'defaulters'
  | 'banking'
  | 'maps'

const accentBg: Record<Accent, string> = {
  brand: 'bg-brand/10',
  members: 'bg-members/10',
  churches: 'bg-churches/10',
  arrivals: 'bg-arrivals/10',
  defaulters: 'bg-defaulters/10',
  banking: 'bg-banking/10',
  maps: 'bg-maps/10',
}

const accentText: Record<Accent, string> = {
  brand: 'text-brand',
  members: 'text-members',
  churches: 'text-churches',
  arrivals: 'text-arrivals',
  defaulters: 'text-defaulters',
  banking: 'text-banking',
  maps: 'text-maps',
}

interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  deltaUp?: boolean
  icon: React.ComponentType<{ className?: string }>
  accent?: Accent
  hint?: string
  loading?: boolean
  /**
   * When `true`, renders the compact horizontal tile on mobile (`< md`)
   * and the default hero layout on desktop (`md+`). Use for grid-of-equals
   * stat headers where mobile vertical real estate is at a premium.
   */
  compact?: boolean
}

const DeltaPill = ({
  delta,
  deltaUp,
  size = 'md',
}: {
  delta: string
  deltaUp: boolean
  size?: 'sm' | 'md'
}) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 font-medium',
      size === 'sm' ? 'text-[11px]' : 'text-xs',
      deltaUp
        ? 'bg-success/15 text-success'
        : 'bg-destructive/15 text-destructive'
    )}
  >
    {deltaUp ? (
      <ArrowUpRight className="size-3" />
    ) : (
      <ArrowDownRight className="size-3" />
    )}
    {delta}
  </span>
)

const HeroLayout = ({
  label,
  value,
  delta,
  deltaUp,
  icon: Icon,
  accent,
  hint,
  loading,
}: Required<Pick<StatCardProps, 'label' | 'value' | 'icon'>> &
  Omit<StatCardProps, 'label' | 'value' | 'icon' | 'compact'> & {
    accent: Accent
  }) => (
  <Card className="h-full overflow-hidden">
    <CardContent className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-lg',
            accentBg[accent]
          )}
        >
          <Icon className={cn('size-5', accentText[accent])} />
        </span>
        {delta && !loading && <DeltaPill delta={delta} deltaUp={!!deltaUp} />}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-24" />
        ) : (
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
        )}
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </CardContent>
  </Card>
)

const CompactLayout = ({
  label,
  value,
  delta,
  deltaUp,
  icon: Icon,
  accent,
  hint,
  loading,
}: Required<Pick<StatCardProps, 'label' | 'value' | 'icon'>> &
  Omit<StatCardProps, 'label' | 'value' | 'icon' | 'compact'> & {
    accent: Accent
  }) => (
  <Card className="h-full overflow-hidden">
    <CardContent className="flex items-center gap-3 p-3">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg',
          accentBg[accent]
        )}
      >
        <Icon className={cn('size-5', accentText[accent])} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-16" />
        ) : (
          <p className="truncate text-xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
        )}
        {hint && !loading && (
          <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        )}
      </div>
      {delta && !loading && (
        <DeltaPill delta={delta} deltaUp={!!deltaUp} size="sm" />
      )}
    </CardContent>
  </Card>
)

export const StatCard = ({
  label,
  value,
  delta,
  deltaUp = true,
  icon,
  accent = 'brand',
  hint,
  loading = false,
  compact = false,
}: StatCardProps) => {
  const layoutProps = {
    label,
    value,
    delta,
    deltaUp,
    icon,
    accent,
    hint,
    loading,
  }

  if (compact) {
    return (
      <>
        <div className="h-full md:hidden">
          <CompactLayout {...layoutProps} />
        </div>
        <div className="hidden h-full md:block">
          <HeroLayout {...layoutProps} />
        </div>
      </>
    )
  }

  return <HeroLayout {...layoutProps} />
}
