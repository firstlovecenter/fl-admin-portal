import { ReactNode } from 'react'

import { Card, CardContent } from 'components/ui/card'
import { Separator } from 'components/ui/separator'
import { Skeleton } from 'components/ui/skeleton'

export type WeekTotalAccent =
  | 'churches'
  | 'members'
  | 'banking'
  | 'defaulters'
  | 'warning'
  | 'destructive'

const ACCENT_CLASSES: Record<WeekTotalAccent, { bg: string; fg: string }> = {
  churches: { bg: 'bg-churches/10', fg: 'text-churches' },
  members: { bg: 'bg-members/10', fg: 'text-members' },
  banking: { bg: 'bg-banking/10', fg: 'text-banking' },
  defaulters: { bg: 'bg-defaulters/10', fg: 'text-defaulters' },
  warning: { bg: 'bg-warning/10', fg: 'text-warning' },
  destructive: { bg: 'bg-destructive/10', fg: 'text-destructive' },
}

export type WeekTotalItem = {
  key: string
  label: string
  value: string
  accent: WeekTotalAccent
  icon: ReactNode
}

type WeekTotalsCardProps = {
  week: number
  items: WeekTotalItem[]
  loading: boolean
}

const WeekTotalsCard = ({ week, items, loading }: WeekTotalsCardProps) => {
  return (
    <Card>
      <CardContent className="space-y-3 p-4 lg:space-y-4 lg:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Week {week} totals
        </p>

        {/* Mobile compact rows */}
        <ul className="divide-y divide-border/60 lg:hidden">
          {items.map((item) => {
            const accent = ACCENT_CLASSES[item.accent]
            return (
              <li
                key={item.key}
                className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
              >
                <div
                  className={`shrink-0 rounded-md p-1.5 ${accent.bg} ${accent.fg} [&_svg]:size-3.5`}
                >
                  {item.icon}
                </div>
                <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {item.label}
                </p>
                {loading ? (
                  <Skeleton className="h-4 w-20 shrink-0" />
                ) : (
                  <p className="shrink-0 text-sm font-bold tabular-nums tracking-tight text-foreground">
                    {item.value}
                  </p>
                )}
              </li>
            )
          })}
        </ul>

        {/* Desktop expanded stack */}
        <div className="hidden space-y-4 lg:block">
          {items.map((item, index) => {
            const accent = ACCENT_CLASSES[item.accent]
            return (
              <div key={item.key}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 rounded-lg p-2 ${accent.bg} ${accent.fg} [&_svg]:size-5`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    {loading ? (
                      <Skeleton className="h-7 w-28" />
                    ) : (
                      <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                        {item.value}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default WeekTotalsCard
