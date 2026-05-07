import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { cn } from 'components/lib/utils'

type Tone = 'good' | 'bad' | 'yellow' | 'neutral'

const toneClass: Record<Tone, string> = {
  good: 'text-success',
  bad: 'text-destructive',
  yellow: 'text-warning',
  neutral: 'text-foreground',
}

type Defaulter = {
  title: string
  link: string
  data?: number | string | null
  color?: string
}

const isInteractive = (link?: string) => !!link && link !== '#'

const resolveTone = (color?: string): Tone => {
  if (color === 'good' || color === 'bad' || color === 'yellow') return color
  return 'neutral'
}

const DefaulterInfoCard = ({ defaulter }: { defaulter: Defaulter }) => {
  const navigate = useNavigate()
  const tone = resolveTone(defaulter.color)
  const clickable = isInteractive(defaulter.link)
  const loading = defaulter.data === undefined || defaulter.data === null

  const handleClick = () => {
    if (clickable) navigate(defaulter.link)
  }

  return (
    <Card
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : -1}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (!clickable) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleClick()
        }
      }}
      className={cn(
        'h-full overflow-hidden transition-colors',
        clickable
          ? 'cursor-pointer hover:bg-muted/50 active:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none'
          : 'cursor-default'
      )}
    >
      <CardContent className="flex min-h-[112px] flex-col justify-between gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {defaulter.title}
          </p>
          {clickable && (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
        </div>
        {loading ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <p
            className={cn(
              'text-3xl font-bold tabular-nums tracking-tight',
              toneClass[tone]
            )}
          >
            {defaulter.data}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default DefaulterInfoCard
