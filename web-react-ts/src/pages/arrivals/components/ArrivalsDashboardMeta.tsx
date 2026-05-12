import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'

type ArrivalsAdmin = {
  id?: string
  fullName?: string
  pictureUrl?: string | null
}

type SubChurchPill = {
  /** Plural label, e.g. `Councils`, `Governorships`, `Streams`. */
  label: string
  /** Count to render before the label, e.g. `1 Council`. */
  count?: number
  /** Route to navigate to on click. */
  to: string
}

type ArrivalsDashboardMetaProps = {
  admin?: ArrivalsAdmin | null
  loading?: boolean
  subChurch?: SubChurchPill
}

const hasSubChurch = (s?: SubChurchPill): s is SubChurchPill =>
  !!s && typeof s.count === 'number'

const initialsOf = (name?: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?'
}

const ArrivalsDashboardMeta = ({
  admin,
  loading,
  subChurch,
}: ArrivalsDashboardMetaProps) => {
  const navigate = useNavigate()

  const showAdmin = !!admin?.fullName
  const showSubChurch = hasSubChurch(subChurch)

  // Cold load — neither piece is ready yet. Render skeleton placeholders so
  // the meta row reserves space (avoids CLS when the data lands).
  if (loading && !showAdmin && !showSubChurch) {
    return (
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Skeleton className="h-11 w-40 rounded-full" />
        {subChurch && <Skeleton className="h-11 w-28 rounded-full" />}
      </div>
    )
  }

  if (!showAdmin && !showSubChurch) return null

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {showAdmin && admin && (
        <div
          className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-muted/40 py-1 pl-1 pr-3"
          aria-label={`Arrivals admin: ${admin.fullName}`}
        >
          <Avatar className="size-8">
            {admin.pictureUrl ? (
              <AvatarImage src={admin.pictureUrl} alt={admin.fullName} />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {initialsOf(admin.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs font-medium text-foreground">
            {admin.fullName}
          </span>
          <Badge
            variant="outline"
            className="border-arrivals/30 bg-arrivals/10 px-1.5 py-0 text-[10px] uppercase tracking-wider text-arrivals"
          >
            Admin
          </Badge>
        </div>
      )}

      {showSubChurch && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 gap-1 rounded-full px-3 text-xs font-medium tabular-nums"
          onClick={() => navigate(subChurch.to)}
          aria-label={`View ${subChurch.label}`}
        >
          <span>
            {subChurch.count} {subChurch.label}
          </span>
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}

export default ArrivalsDashboardMeta
