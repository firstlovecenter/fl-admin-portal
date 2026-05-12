import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select'
import {
  METRIC_COLOR,
  METRIC_LABEL,
} from 'pages/shepherding-control/shepherding-control-utils'
import { MetricKey } from 'pages/shepherding-control/shepherding-control-types'

const ALL_METRICS: MetricKey[] = [
  'serviceAttendance',
  'bussingAttendance',
  'income',
]

type Props = {
  label: string
  value: MetricKey | null
  onChange: (next: MetricKey | null) => void
  allowNone?: boolean
}

const NONE_VALUE = '__none__'

const MetricPicker = ({ label, value, onChange, allowNone }: Props) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-base uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Select
        value={value ?? NONE_VALUE}
        onValueChange={(next) => {
          if (next === NONE_VALUE) {
            onChange(null)
            return
          }
          onChange(next as MetricKey)
        }}
      >
        <SelectTrigger className="min-h-11 min-w-44 px-4 text-base">
          <SelectValue placeholder="Pick a metric" />
        </SelectTrigger>
        <SelectContent>
          {allowNone && <SelectItem value={NONE_VALUE}>None</SelectItem>}
          {ALL_METRICS.map((m) => (
            <SelectItem key={m} value={m}>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: METRIC_COLOR[m] }}
                />
                {METRIC_LABEL[m]}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default MetricPicker
