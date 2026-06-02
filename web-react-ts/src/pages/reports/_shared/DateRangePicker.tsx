import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { formatWeekKey, parseDateInput, toWeekKey } from './week-utils'

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
  const start = parseDateInput(startDate)
  const end = parseDateInput(endDate)
  const startWeekKey = start ? toWeekKey(start) : null
  const endWeekKey = end ? toWeekKey(end) : null

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Date range
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="report-start-date" className="text-xs">
            From
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
            To
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
          Covers {formatWeekKey(startWeekKey)} → {formatWeekKey(endWeekKey)}
        </p>
      )}
    </section>
  )
}

export default DateRangePicker
