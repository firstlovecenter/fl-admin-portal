import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { useTranslation } from 'react-i18next'
import { fromWeekKey, parseDateInput, toWeekKey } from './week-utils'

type DateRangePickerProps = {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
}

const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) => {
  const { t } = useTranslation()
  const start = parseDateInput(startDate)
  const end = parseDateInput(endDate)
  const startWeekKey = start ? toWeekKey(start) : null
  const endWeekKey = end ? toWeekKey(end) : null

  const formatWeek = (weekKey: number) => {
    const { week, year } = fromWeekKey(weekKey)
    return t('reports.shared.weekKey', { week, year })
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('reports.shared.dateRange')}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="report-start-date" className="text-xs">
            {t('reports.shared.from')}
          </Label>
          <Input
            id="report-start-date"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-end-date" className="text-xs">
            {t('reports.shared.to')}
          </Label>
          <Input
            id="report-end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="h-11"
          />
        </div>
      </div>
      {startWeekKey !== null && endWeekKey !== null && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t('reports.shared.covers', {
            start: formatWeek(startWeekKey),
            end: formatWeek(endWeekKey),
          })}
        </p>
      )}
    </section>
  )
}

export default DateRangePicker
