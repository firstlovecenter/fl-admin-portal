import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../accounts-utils'

export type BalanceCardProps = {
  label: string
  value: number | null | undefined
  hint: string
  icon: React.ComponentType<{ className?: string }>
  accentBg: string
  accentText: string
  loading: boolean
}

export const BalanceCard = ({
  label,
  value,
  hint,
  icon: Icon,
  accentBg,
  accentText,
  loading,
}: BalanceCardProps) => (
  <Card className="overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-10 items-center justify-center rounded-lg ${accentBg}`}
        >
          <Icon className={`size-5 ${accentText}`} />
        </span>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-32" />
        ) : (
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {formatCurrency(value)}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </CardContent>
  </Card>
)

export type ActionRowProps = {
  to: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconText: string
  title: string
  description: string
}

export const ActionRow = ({
  to,
  icon: Icon,
  iconBg,
  iconText,
  title,
  description,
}: ActionRowProps) => (
  <Link
    to={to}
    aria-label={title}
    className="group block rounded-xl border border-border bg-card transition-colors hover:bg-muted/40 active:bg-muted"
  >
    <div className="flex min-h-[88px] items-center gap-3 p-4">
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <Icon className={`size-5 ${iconText}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">
          {title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  </Link>
)
