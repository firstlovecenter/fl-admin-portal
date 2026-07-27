import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'
import useSelectedArrivalDate from 'hooks/useSelectedArrivalDate'

type ArrivalDateSelectorProps = {
  className?: string
}

const ArrivalDateSelector = ({ className }: ArrivalDateSelectorProps) => {
  const { t } = useTranslation()
  const {
    arrivalDate,
    weekLabel,
    isCurrent,
    daysInWeek,
    prevWeek,
    nextWeek,
    hasPrev,
    hasNext,
    selectDate,
    jumpToNearest,
    hasNearest,
    resetToCurrent,
  } = useSelectedArrivalDate()

  const weekIsEmpty = daysInWeek.length === 0
  const showChipRow = daysInWeek.length >= 2

  return (
    <div className={cn('flex flex-col items-stretch gap-2', className)}>
      <div className="flex items-center gap-2 rounded-lg border bg-background p-1.5 shadow-xs">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 lg:size-9"
          onClick={prevWeek}
          disabled={!hasPrev}
          aria-label={t('shared.weekSelector.previousWeek')}
        >
          <ChevronLeft />
        </Button>

        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {weekLabel}
          </span>
          {!weekIsEmpty && (
            <span className="truncate text-xs text-muted-foreground tabular-nums">
              {arrivalDate}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 lg:size-9"
          onClick={nextWeek}
          disabled={!hasNext}
          aria-label={t('shared.weekSelector.nextWeek')}
        >
          <ChevronRight />
        </Button>
      </div>

      {showChipRow && (
        <div
          className="flex flex-wrap justify-center gap-2"
          role="group"
          aria-label={t('shared.arrivalDateSelector.bussingDays')}
        >
          {daysInWeek.map((day) => {
            const active = day.date === arrivalDate
            return (
              <Button
                key={day.date}
                type="button"
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => selectDate(day.date)}
                aria-pressed={active}
                className={cn(
                  'h-8 rounded-full px-3 text-xs font-medium tabular-nums sm:h-10 sm:px-4 sm:text-sm',
                  active &&
                    'bg-arrivals text-white hover:bg-arrivals/90 focus-visible:ring-arrivals/40'
                )}
              >
                {day.label}
              </Button>
            )
          })}
        </div>
      )}

      {weekIsEmpty && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-center">
          <span className="text-sm text-muted-foreground">
            {t('shared.arrivalDateSelector.noBussings')}
          </span>
          {hasNearest && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 gap-2"
              onClick={jumpToNearest}
            >
              {t('shared.arrivalDateSelector.jumpToNearest')}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      )}

      {!isCurrent && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="min-h-11 self-center px-3 text-muted-foreground"
          onClick={resetToCurrent}
        >
          {t('shared.arrivalDateSelector.resetToToday')}
        </Button>
      )}
    </div>
  )
}

export default ArrivalDateSelector
