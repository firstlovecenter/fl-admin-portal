import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'
import useSelectedArrivalDate from 'hooks/useSelectedArrivalDate'

type ArrivalDateSelectorProps = {
  className?: string
}

const ArrivalDateSelector = ({ className }: ArrivalDateSelectorProps) => {
  const {
    arrivalDate,
    dateLabel,
    isCurrent,
    prevWeek,
    nextWeek,
    resetToCurrent,
  } = useSelectedArrivalDate()

  return (
    <div className={cn('flex flex-col items-stretch gap-1', className)}>
      <div className="flex items-center gap-2 rounded-lg border bg-background p-1.5 shadow-xs">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 lg:size-9"
          onClick={prevWeek}
          aria-label="Previous week"
        >
          <ChevronLeft />
        </Button>

        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {dateLabel}
          </span>
          <span className="truncate text-xs text-muted-foreground tabular-nums">
            {arrivalDate}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 lg:size-9"
          onClick={nextWeek}
          disabled={isCurrent}
          aria-label="Next week"
        >
          <ChevronRight />
        </Button>
      </div>

      {!isCurrent && (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="self-center text-muted-foreground"
          onClick={resetToCurrent}
        >
          Reset to most recent Sunday
        </Button>
      )}
    </div>
  )
}

export default ArrivalDateSelector
