import { cn } from 'components/lib/utils'
import { Badge } from 'components/ui/badge'
import { Skeleton } from 'components/ui/skeleton'
import { MemberContext } from 'contexts/MemberContext'
import { useContext } from 'react'

type DetailsCardPropsType = {
  subtitle?: string
  avatar?: string
  heading?: string
  loading?: boolean
  detail?: string
  onClick?: () => void
  bgNone?: boolean
  img?: string
  vacationCount?: string
  leading?: JSX.Element
  trailing?: JSX.Element
}

const DetailsCard = (props: DetailsCardPropsType) => {
  const { currentUser } = useContext(MemberContext)
  const { leading, trailing, detail, heading, onClick } = props
  const loading = !heading || props.loading || !currentUser.id || !detail

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 m-1">
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-6 w-24" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-3 m-1 transition-all duration-200',
        onClick &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/50 hover:shadow-sm active:translate-y-0 active:bg-muted active:shadow-none'
      )}
      onClick={onClick}
    >
      <p className="text-xs text-muted-foreground mb-1">{heading}</p>
      <div className="flex items-center gap-2">
        {leading && <>{leading}</>}
        <p className="text-base font-semibold tabular-nums truncate text-foreground flex-1">
          {detail?.replace(currentUser.currency, '')}
          {detail?.match(currentUser.currency) && (
            <span className="text-xs font-normal text-muted-foreground ml-1">
              {currentUser.currency}
            </span>
          )}
        </p>
        {trailing && <>{trailing}</>}
        {parseFloat(props?.vacationCount?.toString() || '0') !== 0 && (
          <Badge variant="destructive" className="text-xs shrink-0">
            +{props?.vacationCount} Vacation
          </Badge>
        )}
      </div>
    </div>
  )
}

export default DetailsCard
