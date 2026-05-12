import { Skeleton } from 'components/ui/skeleton'

export const statClass = (value: number, goodWhenZero = true) =>
  goodWhenZero
    ? value
      ? 'text-destructive'
      : 'text-success'
    : value
    ? 'text-success'
    : 'text-muted-foreground'

export const bankedClass = (banked: number, services: number) => {
  if (services === 0) return 'text-muted-foreground'
  if (banked === services) return 'text-success'
  if (banked > 0) return 'text-warning'
  return 'text-destructive'
}

export const StatRow = ({
  label,
  value,
  valueClass,
}: {
  label: string
  value: number
  valueClass: string
}) => (
  <div className="flex items-center justify-between px-4 py-2.5">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>
      {value}
    </span>
  </div>
)

export const SummaryRow = ({
  label,
  value,
  valueClass = 'text-foreground',
}: {
  label: string
  value: string
  valueClass?: string
}) => (
  <div className="flex items-center justify-between px-4 py-2.5">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>
      {value}
    </span>
  </div>
)

export const CardSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card">
    <div className="border-b border-border px-4 py-3">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-1.5 h-4 w-32" />
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, j) => (
        <div key={j} className="flex items-center justify-between px-4 py-2.5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
    <div className="flex gap-3 border-t border-border bg-muted/20 px-4 py-3">
      <Skeleton className="h-10 w-20 rounded-md" />
      <Skeleton className="h-10 w-28 rounded-md" />
    </div>
  </div>
)
