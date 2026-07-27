import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'
import useSelectedWeek from 'hooks/useSelectedWeek'

type WeekSelectorProps = {
  className?: string
}

const WeekSelector = ({ className }: WeekSelectorProps) => {
  const { t } = useTranslation()
  const {
    week,
    year,
    rangeLabel,
    isCurrent,
    prevWeek,
    nextWeek,
    resetToCurrent,
  } = useSelectedWeek()

  return (
    <div className={cn('flex flex-col items-stretch gap-1', className)}>
      <div className="flex items-center gap-2 rounded-lg border bg-background p-1.5 shadow-xs">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 lg:size-9"
          onClick={prevWeek}
          aria-label={t('shared.weekSelector.previousWeek')}
        >
          <ChevronLeft />
        </Button>

        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {t('shared.weekSelector.weekAndYear', { week, year })}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {rangeLabel}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 lg:size-9"
          onClick={nextWeek}
          disabled={isCurrent}
          aria-label={t('shared.weekSelector.nextWeek')}
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
          {t('shared.weekSelector.resetToCurrent')}
        </Button>
      )}
    </div>
  )
}

export default WeekSelector
